const express = require('express');
const router = express.Router();
const {
    issueBook,
    returnBook,
    getMyTransactions,
    getOverdueBooks,
    getFineCollection,
    exportCSV,
    getDashStats,
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

router.post('/issue', protect, authorize('librarian'), issueBook);
router.post('/return', protect, authorize('librarian'), returnBook);
router.get('/my', protect, getMyTransactions);
router.get('/overdue', protect, authorize('librarian'), getOverdueBooks);
router.get('/fines', protect, authorize('librarian'), getFineCollection);
router.get('/export', protect, authorize('librarian'), exportCSV);
router.get('/stats', protect, getDashStats);

module.exports = router;
