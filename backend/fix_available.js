const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./models/Book');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const books = await Book.find({});
    for (const book of books) {
        book.availableCopies = book.totalCopies;
        await book.save();
    }
    console.log(`Updated ${books.length} books — availableCopies set to totalCopies`);
    process.exit(0);
});
