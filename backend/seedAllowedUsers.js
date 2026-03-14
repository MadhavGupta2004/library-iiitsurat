/**
 * Seed allowed users (whitelist) - only these people can register/login.
 * Replace the emails and names below with your 6 students + 1 librarian,
 * then run: node seedAllowedUsers.js
 *
 * Later you can add ~500 students by adding more objects to the students array
 * (or import from a file). Run this script again to add new allowed users
 * This script also CLEARS all registered users (users collection), so old
 * test accounts are removed. Your 7 people must register again after running.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AllowedUser = require('./models/AllowedUser');
const User = require('./models/User');

dotenv.config();

// ========== REPLACE WITH YOUR 6 STUDENTS + 1 LIBRARIAN ==========
const ALLOWED_USERS = [
    // Librarian (1)
    { email: 'librarian@iiitsurat.ac.in', role: 'librarian', name: 'Library Admin' },
    // Students (6) - replace with real emails and names
    { email: 'ui23ec33@iiitsurat.ac.in', role: 'student', name: 'Madhav Gupta' },
    { email: 'ui23ec06@iiitsurat.ac.in', role: 'student', name: 'Arpit Chauhan' },
    { email: 'ui23ec04@iiitsurat.ac.in', role: 'student', name: 'Ankit Kumar' },
    { email: 'ui23ec34@iiitsurat.ac.in', role: 'student', name: 'Kunal Mahendra' },
    { email: 'ui23ec02@iiitsurat.ac.in', role: 'student', name: 'Adarsh Pandey' },
    { email: 'ui23ec03@iiitsurat.ac.in', role: 'student', name: 'Aditya Anand' },
];
// =================================================================

const seedAllowedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing allowed users so the list matches this file exactly
        await AllowedUser.deleteMany({});
        console.log('Cleared existing allowed users');

        // Remove all registered users so old test accounts (librarian, student1@...) are gone
        const deletedUsers = await User.deleteMany({});
        console.log(`Cleared ${deletedUsers.deletedCount} registered user(s) from database`);

        for (const entry of ALLOWED_USERS) {
            const email = entry.email.toLowerCase().trim();
            await AllowedUser.create({
                email,
                role: entry.role,
                name: entry.name || '',
            });
            console.log(`✅ Allowed: ${email} (${entry.role})`);
        }

        console.log(`\n🎉 Done. ${ALLOWED_USERS.length} allowed users in whitelist.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

seedAllowedUsers();
