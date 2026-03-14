const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    getMyPayments,
    getAllPayments,
    markPaidManually,
    downloadReceipt,
    exportPaymentsCSV,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getMyPayments);
router.get('/all', protect, authorize('librarian'), getAllPayments);
router.post('/mark-paid', protect, authorize('librarian'), markPaidManually);
router.get('/receipt/:id', protect, downloadReceipt);
router.get('/export', protect, authorize('librarian'), exportPaymentsCSV);

module.exports = router;
