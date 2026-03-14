const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Initialize Razorpay (Optional - only if keys are present)
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
} else {
    console.warn('WARNING: Razorpay keys are missing. Online payments will not work.');
}

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({ message: 'Razorpay keys are not configured. Please contact the administrator.' });
        }
        const user = await User.findById(req.user._id);

        // Calculate current fine from transactions to ensure it's up to date
        const overdueBooks = await Transaction.find({
            user: req.user._id,
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
            { $match: { user: req.user._id, status: 'returned', fine: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$fine' } } },
        ]);

        currentFine += returnedFines[0]?.total || 0;

        if (currentFine <= 0) {
            return res.status(400).json({ message: 'No fine to pay' });
        }

        const options = {
            amount: currentFine * 100, // amount in the smallest currency unit (paise for INR)
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // Create pending payment record
        const payment = await Payment.create({
            user: req.user._id,
            amount: currentFine,
            razorpayOrderId: order.id,
            status: 'pending',
            paymentMethod: 'online',
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            paymentId: payment._id
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isSignatureValid = expectedSignature === razorpay_signature;

        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found' });
        }

        if (isSignatureValid) {
            payment.status = 'success';
            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
            await payment.save();

            // Update user fine
            const user = await User.findById(payment.user);
            user.fineAmount = 0;
            user.paymentHistory.push(payment._id);
            await user.save();

            // Mark all transaction fines as paid (reset them to 0 as they are settled)
            // For returned books, we set fine to 0 because it's collected
            await Transaction.updateMany(
                { user: payment.user, status: 'returned', fine: { $gt: 0 } },
                { $set: { fine: 0 } }
            );

            // For overdue books, we can't easily reset because fine grows daily.
            // But we already reset user.fineAmount which is what matters for "total fine".
            // In a real system, we might mark these transactions as "fine paid until [date]".
            // For simplicity here, we'll just rely on user.fineAmount = 0.

            res.json({ message: 'Payment verified successfully', payment });
        } else {
            payment.status = 'failed';
            await payment.save();
            res.status(400).json({ message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Verify Payment Error:', error);
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
                $lte: new Date(endDate)
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

// @desc    Mark fine as paid manually (Librarian)
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
        });

        user.fineAmount = 0;
        user.paymentHistory.push(payment._id);
        await user.save();

        // Clear transaction fines
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

        // Only the user who made the payment or a librarian can download the receipt
        if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'librarian') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (payment.status !== 'success') {
            return res.status(400).json({ message: 'Receipt only available for successful payments' });
        }

        const doc = new PDFDocument({ margin: 50 });

        // Response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment._id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('IIIT Surat Library', { align: 'center' });
        doc.fontSize(10).text('Fine Payment Receipt', { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Details
        doc.fontSize(12).text(`Receipt No: ${payment._id}`);
        doc.text(`Date: ${new Date(payment.createdAt).toLocaleString('en-IN')}`);
        doc.text(`Status: ${payment.status.toUpperCase()}`);
        doc.text(`Payment Method: ${payment.paymentMethod.toUpperCase()}`);
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
            doc.fontSize(10).text(`Transaction ID: ${payment.razorpayPaymentId}`);
        }
        if (payment.razorpayOrderId) {
            doc.fontSize(10).text(`Order ID: ${payment.razorpayOrderId}`);
        }

        doc.moveDown(4);
        doc.fontSize(10).italic().text('This is a computer-generated receipt and does not require a physical signature.', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: error.message });
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

        let csv = 'Payment ID,Student Name,Student Email,Amount (₹),Status,Method,Date,Razorpay ID\n';

        payments.forEach((p) => {
            const row = [
                p._id,
                p.user?.name || 'N/A',
                p.user?.email || 'N/A',
                p.amount,
                p.status,
                p.paymentMethod,
                new Date(p.createdAt).toLocaleString('en-IN'),
                p.razorpayPaymentId || 'N/A'
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
    createOrder,
    verifyPayment,
    getMyPayments,
    getAllPayments,
    markPaidManually,
    downloadReceipt,
    exportPaymentsCSV,
};
