const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

function toObjectId(userId) {
    if (userId == null) return null;
    if (userId instanceof mongoose.Types.ObjectId) return userId;
    if (typeof userId === 'object' && userId._id) {
        return toObjectId(userId._id);
    }
    const s = String(userId);
    if (mongoose.Types.ObjectId.isValid(s) && s.length === 24) {
        return new mongoose.Types.ObjectId(s);
    }
    return null;
}

/**
 * All ways `user` may appear on `transactions` in Mongo (ObjectId, string, mixed drivers).
 * Use with $and: [ userIdFilter(uid), { ...other } ] to avoid "success payment but no row updated".
 */
function userIdFilter(uid) {
    const o = toObjectId(uid);
    if (!o) {
        return { _id: { $in: [] } };
    }
    const s = o.toString();
    return { $or: [{ user: o }, { user: s }] };
}

/**
 * One source of truth for "how much this student must pay" (navbar, pay-fine, create order).
 * - Issued/Overdue, past due: accrual unless overdueAccrualClearedAt is set
 * - Returned, fine still on the line: stored fine
 * Include DB status "overdue" in case any records use it; active issues are still "issued" in the normal path.
 */
async function getTotalFineOwedForStudent(userId) {
    const uid = toObjectId(userId);
    if (!uid) return 0;
    const now = new Date();

    const activeOverdues = await Transaction.find({
        $and: [
            userIdFilter(uid),
            { status: { $in: ['issued', 'overdue'] } },
            { dueDate: { $lt: now } },
        ],
    });

    let currentFine = 0;
    activeOverdues.forEach((t) => {
        if (t.overdueAccrualClearedAt) return;
        const diffTime = Math.abs(new Date() - new Date(t.dueDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        currentFine += diffDays * 5;
    });

    // Avoid aggregate $match on user (type mismatch with some legacy docs); use find+sum
    const returnedList = await Transaction.find({
        $and: [userIdFilter(uid), { status: 'returned' }, { fine: { $gt: 0 } }],
    })
        .select('fine')
        .lean();

    const returnedTotal = returnedList.reduce(
        (sum, t) => sum + (Number(t.fine) || 0),
        0
    );

    currentFine += returnedTotal;
    return Math.max(0, currentFine);
}

/**
 * One-line text for the payment record (UPI / intent) so history shows which books/rows were covered.
 */
async function buildCoveredFinesSummaryForIntent(userId) {
    const uid = toObjectId(userId);
    if (!uid) return 'Library fine';
    const now = new Date();
    const parts = [];

    const activeOverdues = await Transaction.find({
        $and: [
            userIdFilter(uid),
            { status: { $in: ['issued', 'overdue'] } },
            { dueDate: { $lt: now } },
        ],
    })
        .populate('book', 'title')
        .lean();

    for (const t of activeOverdues) {
        if (t.overdueAccrualClearedAt) continue;
        const d = Math.ceil(
            Math.abs(now - new Date(t.dueDate)) / (1000 * 60 * 60 * 24)
        );
        const r = d * 5;
        if (r <= 0) continue;
        const title = t.book?.title || 'Book on loan';
        parts.push(`"${title}" overdue ₹${r}`);
    }

    const returnedFines = await Transaction.find({
        $and: [userIdFilter(uid), { status: 'returned' }, { fine: { $gt: 0 } }],
    })
        .populate('book', 'title')
        .lean();

    for (const t of returnedFines) {
        const title = t.book?.title || 'Returned copy';
        parts.push(`"${title}" late return ₹${t.fine}`);
    }

    if (parts.length === 0) return 'Library fine (total at checkout time)';
    return parts.join(' · ').slice(0, 900);
}

module.exports = {
    getTotalFineOwedForStudent,
    buildCoveredFinesSummaryForIntent,
    toObjectId,
    userIdFilter,
};
