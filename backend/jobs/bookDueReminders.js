const Transaction = require('../models/Transaction');
const {
    isEmailConfigured,
    sendPreDueReminder,
    sendOverdueNotice,
} = require('../services/emailService');

const TZ = 'Asia/Kolkata';

/** Calendar date YYYY-MM-DD in IST for a given instant */
function istYMD(d) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(d));
}

/** Next calendar day after ymd (IST), given ymd is an IST calendar date string */
function addOneISTCalendarDay(ymd) {
    const [y, mo, da] = ymd.split('-').map(Number);
    const str = `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}T12:00:00+05:30`;
    const date = new Date(str);
    date.setDate(date.getDate() + 1);
    return istYMD(date);
}

/**
 * Daily job: email students 1 IST calendar day before due date, and first overdue notice.
 */
async function runBookDueReminders() {
    if (!isEmailConfigured()) {
        console.log(
            '[bookDueReminders] SMTP not configured; skipping (set SMTP_* in .env).'
        );
        return { skipped: true, preDue: 0, overdue: 0 };
    }

    const todayIST = istYMD(new Date());
    const tomorrowIST = addOneISTCalendarDay(todayIST);

    const active = await Transaction.find({ status: 'issued' })
        .populate('user', 'name email')
        .populate('book', 'title');

    let preDueCount = 0;
    let overdueCount = 0;
    const errors = [];

    for (const t of active) {
        const user = t.user;
        const book = t.book;
        if (!user?.email || !book?.title) continue;

        const dueYMD = istYMD(t.dueDate);

        // Due tomorrow (last full day before becoming overdue on the calendar day after due)
        if (dueYMD === tomorrowIST && !t.preDueReminderSentAt) {
            try {
                await sendPreDueReminder({
                    to: user.email,
                    name: user.name,
                    bookTitle: book.title,
                    dueDate: t.dueDate,
                });
                t.preDueReminderSentAt = new Date();
                await t.save();
                preDueCount += 1;
            } catch (e) {
                errors.push({ id: t._id, type: 'preDue', message: e.message });
                console.error('[bookDueReminders] preDue', t._id, e.message);
            }
            continue;
        }

        // Overdue: due date (IST) is before today IST
        if (dueYMD < todayIST && !t.overdueEmailSentAt) {
            try {
                await sendOverdueNotice({
                    to: user.email,
                    name: user.name,
                    bookTitle: book.title,
                    dueDate: t.dueDate,
                });
                t.overdueEmailSentAt = new Date();
                await t.save();
                overdueCount += 1;
            } catch (e) {
                errors.push({ id: t._id, type: 'overdue', message: e.message });
                console.error('[bookDueReminders] overdue', t._id, e.message);
            }
        }
    }

    console.log(
        `[bookDueReminders] Done. Pre-due emails: ${preDueCount}, overdue emails: ${overdueCount}. Errors: ${errors.length}`
    );
    return { preDue: preDueCount, overdue: overdueCount, errors };
}

function scheduleBookDueReminders() {
    const cron = require('node-cron');
    const spec = process.env.DUE_REMINDER_CRON || '0 9 * * *'; // 09:00 server time daily
    cron.schedule(spec, async () => {
        try {
            await runBookDueReminders();
        } catch (e) {
            console.error('[bookDueReminders] cron error', e);
        }
    });
    console.log(`[bookDueReminders] Scheduled with cron: "${spec}" (server local time)`);
}

/** Tomorrow’s calendar date (YYYY-MM-DD) in IST — due date should match this for “due tomorrow” emails today */
function tomorrowISTYMD() {
    return addOneISTCalendarDay(istYMD(new Date()));
}

/** Noon IST on a given YYYY-MM-DD string (safe for DB dueDate) */
function noonISTFromYMD(ymd) {
    const [y, mo, da] = ymd.split('-').map(Number);
    return new Date(
        `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}T12:00:00+05:30`
    );
}

module.exports = {
    runBookDueReminders,
    scheduleBookDueReminders,
    istYMD,
    addOneISTCalendarDay,
    tomorrowISTYMD,
    noonISTFromYMD,
};
