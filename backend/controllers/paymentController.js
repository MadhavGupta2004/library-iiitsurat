const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

async function getCurrentFineForUserId(userId) {
    const overdueBooks = await Transaction.find({
        user: userId,
        status: 'issued',
        dueDate: { $lt: new Date() },
    });

    let currentFine = 0;
    overdueBooks.forEach((t) => {
        const diffTime = Math.abs(new Date() - new Date(t.dueDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        currentFine += diffDays * 5;
    });

    const returnedFines = await Transaction.aggregate([
        { $match: { user: userId, status: 'returned', fine: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$fine' } } },
    ]);

    currentFine += returnedFines[0]?.total || 0;
    return currentFine;
}

async function applyPaymentSuccess(payment) {
    const user = await User.findById(payment.user);
    user.fineAmount = 0;
    user.paymentHistory.push(payment._id);
    await user.save();

    await Transaction.updateMany(
        { user: payment.user, status: 'returned', fine: { $gt: 0 } },
        { $set: { fine: 0 } }
    );
}

// @desc    Create pending UPI payment and return QR payload + VPA
// @route   POST /api/payment/create-upi-intent
// @access  Private
const createUpiIntent = async (req, res) => {
    try {
        const vpa = process.env.UPI_MERCHANT_VPA;
        const payeeName = process.env.UPI_MERCHANT_NAME || 'Library';

        if (!vpa) {
            return res.status(503).json({
                message: 'UPI is not configured. Set UPI_MERCHANT_VPA in server environment.',
            });
        }

        const currentFine = await getCurrentFineForUserId(req.user._id);

        if (currentFine <= 0) {
            return res.status(400).json({ message: 'No fine to pay' });
        }

        await Payment.updateMany(
            { user: req.user._id, status: 'pending', paymentMethod: 'upi' },
            { $set: { status: 'failed' } }
        );

        const payment = await Payment.create({
            user: req.user._id,
            amount: currentFine,
            status: 'pending',
            paymentMethod: 'upi',
        });

        const am = currentFine.toFixed(2);
        const tn = encodeURIComponent(`Library fine ${payment._id}`);
        const upiString = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(
            payeeName
        )}&am=${am}&cu=INR&tn=${tn}`;

        res.json({
            paymentId: payment._id,
            amount: currentFine,
            upiId: vpa,
            upiString,
            payeeName,
        });
    } catch (error) {
        console.error('Create UPI intent Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Librarian confirms UPI / cash received for a pending payment
// @route   POST /api/payment/confirm/:paymentId
// @access  Private (librarian)
const confirmUpiPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'pending') {
            return res.status(400).json({ message: 'This payment is not pending confirmation' });
        }

        payment.status = 'success';
        payment.confirmedBy = req.user._id;
        payment.confirmedAt = new Date();
        await payment.save();

        await applyPaymentSuccess(payment);

        res.json({ message: 'Payment marked as received', payment });
    } catch (error) {
        console.error('Confirm UPI payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's payment history
// @route   GET /api/payment/history
// @access  Private
const getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all payments (Librarian)
// @route   GET /api/payment/all
// @access  Private/Librarian
const getAllPayments = async (req, res) => {
    try {
        const { status, studentId, startDate, endDate } = req.query;
        let query = {};

        if (status) query.status = status;
        if (studentId) query.user = studentId;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const payments = await Payment.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark fine as paid manually (Librarian) — e.g. cash at desk, no prior student intent
// @route   POST /api/payment/mark-paid
// @access  Private/Librarian
const markPaidManually = async (req, res) => {
    try {
        const { userId, amount, paymentMethod } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const payment = await Payment.create({
            user: userId,
            amount: amount,
            status: 'success',
            paymentMethod: paymentMethod || 'offline',
            confirmedBy: req.user._id,
            confirmedAt: new Date(),
        });

        user.fineAmount = 0;
        user.paymentHistory.push(payment._id);
        await user.save();

        await Transaction.updateMany(
            { user: userId, status: 'returned', fine: { $gt: 0 } },
            { $set: { fine: 0 } }
        );

        res.json({ message: 'Fine marked as paid successfully', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download Receipt (PDF)
// @route   GET /api/payment/receipt/:id
// @access  Private
const downloadReceipt = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'librarian') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (payment.status !== 'success') {
            return res.status(400).json({ message: 'Receipt only available for successful payments' });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment._id}.pdf`);

        doc.pipe(res);

        doc.fontSize(20).text('IIIT Surat Library', { align: 'center' });
        doc.fontSize(10).text('Fine Payment Receipt', { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(12).text(`Receipt / Payment ID: ${payment._id}`);
        doc.text(`Date: ${new Date(payment.createdAt).toLocaleString('en-IN')}`);
        doc.text(`Status: ${payment.status.toUpperCase()}`);
        doc.text(`Payment Method: ${String(payment.paymentMethod).toUpperCase()}`);
        doc.moveDown();

        doc.fontSize(14).text('Student Details:', { underline: true });
        doc.fontSize(12).text(`Name: ${payment.user.name}`);
        doc.text(`Email: ${payment.user.email}`);
        doc.moveDown();

        doc.fontSize(14).text('Payment Summary:', { underline: true });
        doc.fontSize(16).fillColor('green').text(`Total Amount Paid: ₹${payment.amount}`, { bold: true });
        doc.fillColor('black');
        doc.moveDown();

        if (payment.razorpayPaymentId) {
            doc.fontSize(10).text(`Legacy transaction ID: ${payment.razorpayPaymentId}`);
        }

        doc.moveDown(4);
        doc
            .font('Helvetica-Oblique')
            .fontSize(10)
            .text('This is a computer-generated receipt and does not require a physical signature.', {
                align: 'center',
            });
        doc.font('Helvetica');

        doc.end();
    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
};

// @desc    Export Payments to CSV
// @route   GET /api/payment/export
// @access  Private/Librarian
const exportPaymentsCSV = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        let csv = 'Payment ID,Student Name,Student Email,Amount (₹),Status,Method,Date,Ref\n';

        payments.forEach((p) => {
            const ref = p.razorpayPaymentId || (p._id && String(p._id)) || 'N/A';
            const row = [
                p._id,
                p.user?.name || 'N/A',
                p.user?.email || 'N/A',
                p.amount,
                p.status,
                p.paymentMethod,
                new Date(p.createdAt).toLocaleString('en-IN'),
                ref,
            ];
            csv += row.map((v) => `"${v}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUpiIntent,
    confirmUpiPayment,
    getMyPayments,
    getAllPayments,
    markPaidManually,
    downloadReceipt,
    exportPaymentsCSV,
    getCurrentFineForUserId,
};
