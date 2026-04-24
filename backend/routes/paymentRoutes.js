const express = require('express');
const router = express.Router();
const {
    createUpiIntent,
    confirmUpiPayment,
    getMyPayments,
    getAllPayments,
    markPaidManually,
    downloadReceipt,
    exportPaymentsCSV,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/create-upi-intent', protect, createUpiIntent);
router.post('/confirm/:paymentId', protect, authorize('librarian'), confirmUpiPayment);
router.get('/history', protect, getMyPayments);
router.get('/all', protect, authorize('librarian'), getAllPayments);
router.post('/mark-paid', protect, authorize('librarian'), markPaidManually);
router.get('/receipt/:id', protect, downloadReceipt);
router.get('/export', protect, authorize('librarian'), exportPaymentsCSV);

module.exports = router;
