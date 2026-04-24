const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        razorpayOrderId: {
            type: String,
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['online', 'offline', 'upi'],
            default: 'upi',
        },
        confirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        confirmedAt: {
            type: Date,
        },
        receiptUrl: {
            type: String,
        },
        /** Snapshot of what the fine was for (book titles) when UPI intent was created */
        coveredItemsSummary: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
