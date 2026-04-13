/**
 * Dev helper: pick latest issued transaction, set due date to *tomorrow IST*
 * (so today’s reminder job sends “due tomorrow”), clear pre-due flag, run job once.
 *
 * Usage (from backend folder):
 *   node scripts/testPreDueReminder.js
 *   node scripts/testPreDueReminder.js <transactionMongoId>
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
require('../models/User');
require('../models/Book');
const Transaction = require('../models/Transaction');
const {
    runBookDueReminders,
    tomorrowISTYMD,
    noonISTFromYMD,
    istYMD,
} = require('../jobs/bookDueReminders');

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Missing MONGODB_URI');
        process.exit(1);
    }
    await mongoose.connect(uri);

    const idArg = process.argv[2];
    let t;
    if (idArg && mongoose.isValidObjectId(idArg)) {
        t = await Transaction.findOne({ _id: idArg, status: 'issued' });
    } else {
        t = await Transaction.findOne({ status: 'issued' }).sort({
            updatedAt: -1,
        });
    }

    if (!t) {
        console.error(
            'No issued transaction found. Issue a book from the app first, or pass a valid transaction _id.'
        );
        await mongoose.disconnect();
        process.exit(1);
    }

    const ymd = tomorrowISTYMD();
    const dueDate = noonISTFromYMD(ymd);
    t.dueDate = dueDate;
    t.preDueReminderSentAt = undefined;
    t.overdueEmailSentAt = undefined;
    await t.save();

    await t.populate('user', 'name email');
    await t.populate('book', 'title');

    console.log('Updated transaction:', t._id.toString());
    console.log('  Book:', t.book?.title);
    console.log('  Student email:', t.user?.email);
    console.log('  dueDate (stored):', t.dueDate.toISOString());
    console.log('  dueDate as IST date:', istYMD(t.dueDate), '(must equal tomorrow IST:', ymd + ')');

    const result = await runBookDueReminders();
    console.log('runBookDueReminders result:', result);

    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
