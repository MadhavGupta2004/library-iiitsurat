const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AllowedUser = require('../models/AllowedUser');

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

module.exports = { register, login, getMe };
