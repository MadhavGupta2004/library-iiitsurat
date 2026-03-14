const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return v.endsWith('@iiitsurat.ac.in');
                },
                message: 'Only @iiitsurat.ac.in emails are allowed',
            },
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['student', 'librarian'],
            default: 'student',
        },
        fineAmount: {
            type: Number,
            default: 0,
        },
        paymentHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Payment',
            },
        ],
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
