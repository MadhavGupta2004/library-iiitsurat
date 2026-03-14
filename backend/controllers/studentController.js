const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get all students (librarian) with search by name or enrollment/email
// @route   GET /api/students?search=...
// @access  Private/Librarian
const getStudents = async (req, res) => {
    try {
        const { search } = req.query;

        const filter = { role: 'student' };
        if (search && search.trim()) {
            const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { name: { $regex: term, $options: 'i' } },
                { email: { $regex: term, $options: 'i' } },
            ];
        }

        const students = await User.find(filter)
            .select('name email fineAmount')
            .sort({ name: 1 })
            .lean();

        if (students.length === 0) {
            return res.json([]);
        }

        const studentIds = students.map((s) => s._id);

        // Count currently issued books per student
        const issuedCounts = await Transaction.aggregate([
            { $match: { status: 'issued', user: { $in: studentIds } } },
            { $group: { _id: '$user', count: { $sum: 1 } } },
        ]);

        const countMap = {};
        issuedCounts.forEach((c) => (countMap[c._id.toString()] = c.count));

        const result = students.map((s) => ({
            _id: s._id,
            name: s.name,
            email: s.email,
            enrollmentNumber: s.email ? s.email.split('@')[0] : '',
            booksIssued: countMap[s._id.toString()] || 0,
            fineAmount: s.fineAmount || 0,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get issued books for a student (librarian)
// @route   GET /api/students/:id/issued-books
// @access  Private/Librarian
const getStudentIssuedBooks = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.params.id, role: 'student' });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const transactions = await Transaction.find({
            user: req.params.id,
            status: 'issued',
        })
            .populate('book', 'title author isbn')
            .sort({ issueDate: -1 })
            .lean();

        const result = transactions.map((t) => {
            const obj = {
                _id: t._id,
                book: t.book,
                copyNumber: t.copyNumber,
                issueDate: t.issueDate,
                dueDate: t.dueDate,
                isOverdue: new Date(t.dueDate) < new Date(),
            };
            if (obj.isOverdue) {
                const diffDays = Math.ceil((new Date() - new Date(t.dueDate)) / (1000 * 60 * 60 * 24));
                obj.fine = diffDays * 5;
            } else {
                obj.fine = 0;
            }
            return obj;
        });

        res.json({
            student: { name: student.name, email: student.email, enrollmentNumber: student.email?.split('@')[0] },
            issuedBooks: result,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStudents, getStudentIssuedBooks };
