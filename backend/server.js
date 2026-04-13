const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { runBookDueReminders, scheduleBookDueReminders } = require('./jobs/bookDueReminders');

// Load env from backend/.env regardless of where node was started (e.g. repo root)
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
connectDB();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Library Management System API is running' });
});

// Trigger due-date / overdue emails (for external cron, e.g. cron-job.org, when host sleeps)
app.post('/api/internal/due-reminders', async (req, res) => {
    const secret = process.env.CRON_SECRET || process.env.DUE_REMINDER_CRON_SECRET;
    if (!secret || req.get('x-cron-secret') !== secret) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const result = await runBookDueReminders();
        res.json(result);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// In production, serve frontend build and SPA fallback (must be after API routes)
if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, 'public');
    if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(publicPath, 'index.html'));
        });
    }
}

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function startDueReminderSchedule() {
    try {
        scheduleBookDueReminders();
    } catch (e) {
        console.error('[bookDueReminders] failed to schedule', e);
    }
}
if (mongoose.connection.readyState === 1) {
    startDueReminderSchedule();
} else {
    mongoose.connection.once('open', startDueReminderSchedule);
}
