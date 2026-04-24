const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        copyNumber: {
            type: Number,
            required: true,
        },
        issueDate: {
            type: Date,
            default: Date.now,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        returnDate: {
            type: Date,
        },
        fine: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['issued', 'returned', 'overdue'],
            default: 'issued',
        },
        /**
         * Set when a library payment (UPI/confirmed/mark-paid) covers the running
         * late fee for this copy while still issued + past due. Stops re-counting
         * that accrual in totalFine; book may still be physically overdue.
         */
        overdueAccrualClearedAt: {
            type: Date,
            default: null,
        },
        /** Set when "due tomorrow" reminder email was sent (avoid duplicates) */
        preDueReminderSentAt: {
            type: Date,
        },
        /** Set when first overdue notice email was sent */
        overdueEmailSentAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Auto-set due date to 14 days from issue if not provided
transactionSchema.pre('save', function (next) {
    if (this.isNew && !this.dueDate) {
        this.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }
    next();
});

// Calculate fine: ₹5 per day late
transactionSchema.methods.calculateFine = function () {
    if (this.status === 'returned' && this.returnDate > this.dueDate) {
        const diffTime = Math.abs(this.returnDate - this.dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * 5;
    }
    if (this.status === 'issued' && new Date() > this.dueDate) {
        const diffTime = Math.abs(new Date() - this.dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * 5;
    }
    return 0;
};

module.exports = mongoose.model('Transaction', transactionSchema);
