const express = require('express');
const router = express.Router();
const {
    getBooks,
    getBook,
    addBook,
    updateBook,
    deleteBook,
    getAvailableCopies,
    generateQR,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router
    .route('/')
    .get(protect, getBooks)
    .post(protect, authorize('librarian'), upload.single('image'), addBook);

router.get('/available-copies/:id', protect, authorize('librarian'), getAvailableCopies);
router
    .route('/:id')
    .get(protect, getBook)
    .put(protect, authorize('librarian'), upload.single('image'), updateBook)
    .delete(protect, authorize('librarian'), deleteBook);

router.get('/qr/:id/:copyNumber', protect, authorize('librarian'), generateQR);

module.exports = router;
