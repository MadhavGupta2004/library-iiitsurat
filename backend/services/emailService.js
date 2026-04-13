const nodemailer = require('nodemailer');

const APP_NAME = process.env.EMAIL_APP_NAME || 'IIIT Surat Library';

function isEmailConfigured() {
    const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
    return Boolean(
        process.env.SMTP_HOST?.trim() &&
            process.env.SMTP_USER?.trim() &&
            pass.length > 0
    );
}

function getTransporter() {
    if (!isEmailConfigured()) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST?.trim(),
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER?.trim(),
            pass: String(process.env.SMTP_PASS || '').replace(/\s+/g, ''),
        },
        connectionTimeout: 25_000,
        greetingTimeout: 15_000,
        socketTimeout: 25_000,
    });
}

async function sendMail({ to, subject, text, html }) {
    const transporter = getTransporter();
    if (!transporter) {
        console.warn(
            '[email] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS); skipping send.'
        );
        return { skipped: true };
    }
    const from =
        process.env.SMTP_FROM ||
        `"${APP_NAME}" <${process.env.SMTP_USER}>`;
    const replyTo = process.env.SMTP_USER?.trim();
    const info = await transporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        text,
        html,
    });
    return { sent: true, messageId: info.messageId };
}

function formatDueDate(d) {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
    }).format(new Date(d));
}

async function sendPreDueReminder({ to, name, bookTitle, dueDate }) {
    const dueStr = formatDueDate(dueDate);
    const subject = `[${APP_NAME}] Reminder: book due tomorrow (${dueStr})`;
    const text = `Hello ${name},

This is a reminder that the following book is due tomorrow (${dueStr}). Please return it on or before the due date to avoid fines (₹5 per day after the due date).

Book: ${bookTitle}

Thank you,
${APP_NAME}`;
    const html = `<p>Hello ${name},</p>
<p>This is a reminder that the following book is <strong>due tomorrow</strong> (<strong>${dueStr}</strong>).</p>
<p>Please return it on or before the due date to avoid fines (₹5 per day after the due date).</p>
<p><strong>Book:</strong> ${bookTitle}</p>
<p>Thank you,<br/>${APP_NAME}</p>`;
    return sendMail({ to, subject, text, html });
}

async function sendOverdueNotice({ to, name, bookTitle, dueDate }) {
    const dueStr = formatDueDate(dueDate);
    const subject = `[${APP_NAME}] Overdue: please return "${bookTitle}"`;
    const text = `Hello ${name},

The following book is now overdue (due date was ${dueStr}). A fine of ₹5 per day applies from the day after the due date.

Book: ${bookTitle}

Please return the book to the library as soon as possible. You can pay accumulated fines from your student account when applicable.

Thank you,
${APP_NAME}`;
    const html = `<p>Hello ${name},</p>
<p>The following book is <strong>overdue</strong> (due date was <strong>${dueStr}</strong>). A fine of <strong>₹5 per day</strong> applies from the day after the due date.</p>
<p><strong>Book:</strong> ${bookTitle}</p>
<p>Please return the book to the library as soon as possible. You can pay accumulated fines from your student account when applicable.</p>
<p>Thank you,<br/>${APP_NAME}</p>`;
    return sendMail({ to, subject, text, html });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
    const subject = `[${APP_NAME}] Reset your password`;
    const localhostNote =
        resetUrl.includes('localhost') || resetUrl.includes('127.0.0.1')
            ? `\n\nNote: This link uses localhost—it only opens on the same computer that runs the app, not on another phone or PC. For testing on your phone, set CLIENT_URL in server .env to your PC's Wi‑Fi IP (e.g. http://192.168.1.5:5173) and request a new reset email.`
            : '';
    const localhostHtml =
        resetUrl.includes('localhost') || resetUrl.includes('127.0.0.1')
            ? `<p style="color:#666;font-size:13px;margin-top:16px"><strong>Phone not opening the link?</strong> <code>localhost</code> only works on the computer running the app. Set <code>CLIENT_URL</code> in the server <code>.env</code> to your PC’s Wi‑Fi address (e.g. <code>http://192.168.1.5:5173</code>) and send yourself a new reset email.</p>`
            : '';
    const text = `Hello ${name},

You requested a password reset. Open this link (valid for 1 hour):

${resetUrl}

If you did not request this, ignore this email.
${localhostNote}
${APP_NAME}`;
    const html = `<p>Hello ${name},</p>
<p>You requested a password reset. Click below (link valid for <strong>1 hour</strong>):</p>
<p><a href="${resetUrl}">Reset password</a></p>
<p>If the button does not work, paste this URL into your browser:<br/><code style="word-break:break-all">${resetUrl}</code></p>
${localhostHtml}
<p>If you did not request this, you can ignore this email.</p>
<p>${APP_NAME}</p>`;
    return sendMail({ to, subject, text, html });
}

module.exports = {
    isEmailConfigured,
    sendPreDueReminder,
    sendOverdueNotice,
    sendPasswordResetEmail,
};
