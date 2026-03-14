const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a title'],
            trim: true,
        },
        author: {
            type: String,
            required: [true, 'Please add an author'],
            trim: true,
        },
        isbn: {
            type: String,
            required: [true, 'Please add an ISBN'],
            unique: true,
            trim: true,
        },
        image: {
            type: String,
            default: '',
        },
        totalCopies: {
            type: Number,
            required: [true, 'Please add total copies'],
            min: 1,
        },
        availableCopies: {
            type: Number,
            default: 0,
        },
        rackLocation: {
            type: String,
            required: [true, 'Please add rack location'],
            trim: true,
        },
    },
    { timestamps: true }
);

// Set availableCopies to totalCopies on creation
bookSchema.pre('save', function (next) {
    if (this.isNew) {
        this.availableCopies = this.totalCopies;
    }
    next();
});

module.exports = mongoose.model('Book', bookSchema);
