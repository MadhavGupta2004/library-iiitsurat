const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AllowedUser = require('../models/AllowedUser');
const {
    isEmailConfigured,
    sendPasswordResetEmail,
} = require('../services/emailService');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if email ends with @iiitsurat.ac.in
        if (!email.endsWith('@iiitsurat.ac.in')) {
            return res
                .status(400)
                .json({ message: 'Only @iiitsurat.ac.in emails are allowed' });
        }

        const emailLower = email.toLowerCase().trim();

        // Only whitelisted users can register
        const allowed = await AllowedUser.findOne({ email: emailLower });
        if (!allowed) {
            return res.status(403).json({
                message: 'You are not authorized to register. Contact the library admin.',
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: emailLower });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Use role from whitelist so users cannot register as a different role
        const user = await User.create({
            name,
            email: emailLower,
            password,
            role: allowed.role,
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'Please provide email and password' });
        }

        // Check email domain
        if (!email.endsWith('@iiitsurat.ac.in')) {
            return res
                .status(400)
                .json({ message: 'Only @iiitsurat.ac.in emails are allowed' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const genericForgotMessage =
    'If an account exists for this email, you will receive password reset instructions shortly.';

/** Base URL for reset links: never use localhost on Render (breaks phones). */
function resolvePasswordResetBaseUrl() {
    const client = (process.env.CLIENT_URL || process.env.FRONTEND_URL || '').trim();
    const render = (process.env.RENDER_EXTERNAL_URL || '').trim();
    const localhostish = (u) =>
        /localhost|127\.0\.0\.1/i.test(u || '');

    if (render && (!client || localhostish(client))) {
        return render.replace(/\/$/, '');
    }
    if (client && !localhostish(client)) {
        return client.replace(/\/$/, '');
    }
    if (client) {
        return client.replace(/\/$/, '');
    }
    if (render) {
        return render.replace(/\/$/, '');
    }
    return 'http://localhost:5173';
}

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.endsWith('@iiitsurat.ac.in')) {
            return res.status(400).json({
                message: 'Please provide a valid @iiitsurat.ac.in email address.',
            });
        }

        const emailLower = email.toLowerCase().trim();
        const user = await User.findOne({ email: emailLower });

        // Always same response to avoid email enumeration
        if (!user) {
            return res.json({ message: genericForgotMessage });
        }

        if (!isEmailConfigured()) {
            console.warn('[auth] forgot-password: SMTP not configured');
            return res.status(503).json({
                message:
                    'Password reset email is not available (email not configured). Please contact the library administrator.',
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        await User.findByIdAndUpdate(user._id, {
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });

        // Public HTTPS URL so reset works on any device / any network (not localhost on a phone).
        const baseUrl = resolvePasswordResetBaseUrl();
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl,
        });

        res.json({ message: genericForgotMessage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password with token from email
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res
                .status(400)
                .json({ message: 'Please provide reset token and new password.' });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: 'Password must be at least 6 characters.' });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        }).select('+password');

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired reset link. Please request a new one.',
            });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({
            message:
                'Password has been reset. You can sign in with your new password.',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
