const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const QRCode = require('qrcode');

// @desc    Get all books (with search & pagination)
// @route   GET /api/books
// @access  Private
const getBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};

        // Search by title, author, or ISBN
        if (req.query.search) {
            query = {
                $or: [
                    { title: { $regex: req.query.search, $options: 'i' } },
                    { author: { $regex: req.query.search, $options: 'i' } },
                    { isbn: { $regex: req.query.search, $options: 'i' } },
                ],
            };
        }

        const total = await Book.countDocuments(query);
        const books = await Book.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            books,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Private
const getBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add book
// @route   POST /api/books
// @access  Private/Librarian
const addBook = async (req, res) => {
    try {
        const { title, author, isbn, totalCopies, rackLocation } = req.body;

        const bookExists = await Book.findOne({ isbn });
        if (bookExists) {
            return res
                .status(400)
                .json({ message: 'Book with this ISBN already exists' });
        }

        const bookData = {
            title,
            author,
            isbn,
            totalCopies: parseInt(totalCopies),
            rackLocation,
        };

        if (req.file) {
            bookData.image = `/uploads/${req.file.filename}`;
        }

        const book = await Book.create(bookData);
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private/Librarian
const updateBook = async (req, res) => {
    try {
        let book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }

        // If totalCopies changed, adjust availableCopies
        if (updateData.totalCopies) {
            const diff = parseInt(updateData.totalCopies) - book.totalCopies;
            updateData.availableCopies = Math.max(0, book.availableCopies + diff);
        }

        book = await Book.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.json(book);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private/Librarian
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: 'Book removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available copy numbers for a book (for librarian issue)
// @route   GET /api/books/:id/available-copies
// @access  Private/Librarian
const getAvailableCopies = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        const totalCopies = Number(book.totalCopies) || 0;
        const issued = await Transaction.find(
            { book: book._id, status: 'issued' },
            { copyNumber: 1 }
        ).lean();
        const issuedSet = new Set(issued.map((t) => t.copyNumber));
        const availableCopyNumbers = [];
        for (let n = 1; n <= totalCopies; n++) {
            if (!issuedSet.has(n)) availableCopyNumbers.push(n);
        }
        res.json({
            book: {
                _id: book._id,
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                totalCopies: totalCopies,
            },
            availableCopyNumbers,
        });
    } catch (error) {
        console.error('getAvailableCopies error:', error);
        res.status(500).json({ message: error.message || 'Failed to load copies' });
    }
};

// @desc    Generate QR code for a book copy
// @route   GET /api/books/qr/:id/:copyNumber
// @access  Private/Librarian
const generateQR = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const copyNumber = parseInt(req.params.copyNumber);
        if (copyNumber < 1 || copyNumber > book.totalCopies) {
            return res.status(400).json({ message: 'Invalid copy number' });
        }

        const qrData = JSON.stringify({
            bookId: book._id,
            isbn: book.isbn,
            title: book.title,
            copyNumber,
        });

        const qrImage = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#1a1a2e',
                light: '#ffffff',
            },
        });

        res.json({ qrImage, qrData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBooks,
    getBook,
    addBook,
    updateBook,
    deleteBook,
    getAvailableCopies,
    generateQR,
};
