const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const Payment = require('../models/Payment');

async function sumSuccessfulPayments() {
    const r = await Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return r[0]?.total || 0;
}

/** Rupees for returning after due (same rules as Transaction.calculateFine for returned) */
function lateReturnFineRupees(returnDate, dueDate) {
    if (!returnDate || !dueDate) return 0;
    if (new Date(returnDate) <= new Date(dueDate)) return 0;
    const diffTime = Math.abs(new Date(returnDate) - new Date(dueDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * 5;
}

// @desc    Issue a book (via QR scan)
// @route   POST /api/transactions/issue
// @access  Private/Librarian
const issueBook = async (req, res) => {
    try {
        const { bookId, copyNumber, userId } = req.body;

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.availableCopies <= 0) {
            return res.status(400).json({ message: 'No copies available' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if this copy is already issued
        const existingTransaction = await Transaction.findOne({
            book: bookId,
            copyNumber,
            status: 'issued',
        });

        if (existingTransaction) {
            return res
                .status(400)
                .json({ message: 'This copy is already issued' });
        }

        const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        const transaction = await Transaction.create({
            user: userId,
            book: bookId,
            copyNumber,
            dueDate,
        });

        // Update book availability
        book.availableCopies -= 1;
        await book.save();

        const populated = await Transaction.findById(transaction._id)
            .populate('user', 'name email')
            .populate('book', 'title author isbn');

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Return a book
// @route   POST /api/transactions/return
// @access  Private/Librarian
const returnBook = async (req, res) => {
    try {
        const { bookId, copyNumber } = req.body;

        const transaction = await Transaction.findOne({
            book: bookId,
            copyNumber,
            status: 'issued',
        });

        if (!transaction) {
            return res
                .status(404)
                .json({ message: 'No active issue found for this copy' });
        }

        transaction.returnDate = new Date();
        transaction.status = 'returned';

        // Calculate fine
        const fine = transaction.calculateFine();
        transaction.fine = fine;

        await transaction.save();

        // Update book availability
        const book = await Book.findById(bookId);
        book.availableCopies += 1;
        await book.save();

        const populated = await Transaction.findById(transaction._id)
            .populate('user', 'name email')
            .populate('book', 'title author isbn');

        res.json({ transaction: populated, fine });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my transactions (student)
// @route   GET /api/transactions/my
// @access  Private
const getMyTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .populate('book', 'title author isbn image')
            .sort({ createdAt: -1 });

        const updated = transactions.map((t) => {
            const obj = t.toObject();
            if (obj.status === 'issued' && new Date() > new Date(obj.dueDate)) {
                obj.status = 'overdue';
                const diffTime = Math.abs(new Date() - new Date(obj.dueDate));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                obj.fine = diffDays * 5;
            }
            // Per-book context: `fine` is outstanding on this line (0 after payment). Late fee for that return
            // is still derivable from dates so issue history can show "which book" + amount paid/owed.
            if (obj.status === 'returned') {
                obj.lateReturnFine = lateReturnFineRupees(obj.returnDate, obj.dueDate);
            } else {
                obj.lateReturnFine = 0;
            }
            return obj;
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all overdue books
// @route   GET /api/transactions/overdue
// @access  Private/Librarian
const getOverdueBooks = async (req, res) => {
    try {
        const overdueTransactions = await Transaction.find({
            status: 'issued',
            dueDate: { $lt: new Date() },
        })
            .populate('user', 'name email')
            .populate('book', 'title author isbn')
            .sort({ dueDate: 1 });

        const result = overdueTransactions.map((t) => {
            const obj = t.toObject();
            const diffTime = Math.abs(new Date() - new Date(obj.dueDate));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            obj.fine = diffDays * 5;
            obj.status = 'overdue';
            return obj;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get fine collection summary
// @route   GET /api/transactions/fines
// @access  Private/Librarian
const getFineCollection = async (req, res) => {
    try {
        // Money actually received (UPI, cash, legacy online) — not transaction.fine, which is cleared when paid
        const totalCollected = await sumSuccessfulPayments();
        const collectedPayments = await Payment.find({ status: 'success' })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        // Pending fines (overdue but not returned)
        const overdueTransactions = await Transaction.find({
            status: 'issued',
            dueDate: { $lt: new Date() },
        })
            .populate('user', 'name email')
            .populate('book', 'title author isbn');

        let totalPending = 0;
        const pendingFines = overdueTransactions.map((t) => {
            const obj = t.toObject();
            const diffTime = Math.abs(new Date() - new Date(obj.dueDate));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            obj.fine = diffDays * 5;
            totalPending += obj.fine;
            return obj;
        });

        res.json({
            totalCollected,
            totalPending,
            collectedPayments,
            /** @deprecated use collectedPayments; kept for older clients */
            paidFines: [],
            pendingFines,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export transactions to CSV
// @route   GET /api/transactions/export
// @access  Private/Librarian
const exportCSV = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('user', 'name email')
            .populate('book', 'title author isbn')
            .sort({ createdAt: -1 });

        // Build CSV string
        let csv = 'Student Name,Student Email,Book Title,Author,ISBN,Copy#,Issue Date,Due Date,Return Date,Fine (₹),Status\n';

        transactions.forEach((t) => {
            const row = [
                t.user?.name || 'N/A',
                t.user?.email || 'N/A',
                t.book?.title || 'N/A',
                t.book?.author || 'N/A',
                t.book?.isbn || 'N/A',
                t.copyNumber,
                new Date(t.issueDate).toLocaleDateString('en-IN'),
                new Date(t.dueDate).toLocaleDateString('en-IN'),
                t.returnDate ? new Date(t.returnDate).toLocaleDateString('en-IN') : 'Not returned',
                t.fine || 0,
                t.status,
            ];
            csv += row.map((v) => `"${v}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=transactions.csv'
        );
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/transactions/stats
// @access  Private
const getDashStats = async (req, res) => {
    try {
        if (req.user.role === 'librarian') {
            const totalBooks = await require('../models/Book').countDocuments();
            const totalUsers = await User.countDocuments({ role: 'student' });
            const activeIssues = await Transaction.countDocuments({ status: 'issued' });
            const overdueCount = await Transaction.countDocuments({
                status: 'issued',
                dueDate: { $lt: new Date() },
            });
            const totalFinesCollected = await sumSuccessfulPayments();

            res.json({
                totalBooks,
                totalUsers,
                activeIssues,
                overdueCount,
                totalFinesCollected,
            });
        } else {
            // Student stats
            const issuedBooks = await Transaction.countDocuments({
                user: req.user._id,
                status: 'issued',
            });
            const returnedBooks = await Transaction.countDocuments({
                user: req.user._id,
                status: 'returned',
            });
            const overdueBooks = await Transaction.find({
                user: req.user._id,
                status: 'issued',
                dueDate: { $lt: new Date() },
            });

            let totalFine = 0;
            overdueBooks.forEach((t) => {
                const diffTime = Math.abs(new Date() - new Date(t.dueDate));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalFine += diffDays * 5;
            });

            // Add fines from returned books
            const returnedFines = await Transaction.aggregate([
                { $match: { user: req.user._id, status: 'returned', fine: { $gt: 0 } } },
                { $group: { _id: null, total: { $sum: '$fine' } } },
            ]);

            totalFine += returnedFines[0]?.total || 0;

            res.json({
                issuedBooks,
                returnedBooks,
                overdueCount: overdueBooks.length,
                totalFine,
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    issueBook,
    returnBook,
    getMyTransactions,
    getOverdueBooks,
    getFineCollection,
    exportCSV,
    getDashStats,
};
