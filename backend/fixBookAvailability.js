/**
 * One-time fix: Recalculate availableCopies for all books based on
 * actual issued transactions (fixes mismatch from old reserve feature).
 *
 * Run from backend folder: node fixBookAvailability.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('./models/Book');
const Transaction = require('./models/Transaction');

dotenv.config();

const fixBookAvailability = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected\n');

        const books = await Book.find({});
        let updated = 0;

        for (const book of books) {
            const issuedCount = await Transaction.countDocuments({
                book: book._id,
                status: 'issued',
            });

            const correctAvailable = Math.max(0, book.totalCopies - issuedCount);

            if (book.availableCopies !== correctAvailable) {
                const oldVal = book.availableCopies;
                book.availableCopies = correctAvailable;
                await book.save();
                console.log(
                    `✅ ${book.title} (${book.isbn}): availableCopies ${oldVal} → ${correctAvailable} (${issuedCount} issued)`
                );
                updated++;
            }
        }

        console.log(`\n🎉 Done. ${updated} book(s) updated, ${books.length - updated} already correct.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

fixBookAvailability();
