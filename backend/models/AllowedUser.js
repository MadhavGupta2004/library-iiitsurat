const mongoose = require('mongoose');

const allowedUserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
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
        role: {
            type: String,
            enum: ['student', 'librarian'],
            required: true,
        },
        name: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AllowedUser', allowedUserSchema);
