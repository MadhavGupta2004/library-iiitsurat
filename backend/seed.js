const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('./models/Book');
const User = require('./models/User');

dotenv.config();

const sampleBooks = [
    {
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        isbn: '978-0262033848',
        totalCopies: 5,
        rackLocation: 'Section A, Shelf 1',
    },
    {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        totalCopies: 3,
        rackLocation: 'Section A, Shelf 2',
    },
    {
        title: 'Design Patterns',
        author: 'Erich Gamma, Richard Helm',
        isbn: '978-0201633610',
        totalCopies: 4,
        rackLocation: 'Section A, Shelf 3',
    },
    {
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt, David Thomas',
        isbn: '978-0135957059',
        totalCopies: 3,
        rackLocation: 'Section B, Shelf 1',
    },
    {
        title: 'Computer Networking: A Top-Down Approach',
        author: 'James Kurose, Keith Ross',
        isbn: '978-0133594140',
        totalCopies: 6,
        rackLocation: 'Section B, Shelf 2',
    },
    {
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz',
        isbn: '978-1119800361',
        totalCopies: 4,
        rackLocation: 'Section B, Shelf 3',
    },
    {
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry Korth',
        isbn: '978-0078022159',
        totalCopies: 5,
        rackLocation: 'Section C, Shelf 1',
    },
    {
        title: 'Artificial Intelligence: A Modern Approach',
        author: 'Stuart Russell, Peter Norvig',
        isbn: '978-0134610993',
        totalCopies: 3,
        rackLocation: 'Section C, Shelf 2',
    },
    {
        title: 'Computer Organization and Design',
        author: 'David Patterson, John Hennessy',
        isbn: '978-0124077263',
        totalCopies: 4,
        rackLocation: 'Section C, Shelf 3',
    },
    {
        title: 'Discrete Mathematics and Its Applications',
        author: 'Kenneth H. Rosen',
        isbn: '978-0073383095',
        totalCopies: 6,
        rackLocation: 'Section D, Shelf 1',
    },
    {
        title: 'Data Structures and Algorithms in Java',
        author: 'Robert Lafore',
        isbn: '978-0672324536',
        totalCopies: 4,
        rackLocation: 'Section D, Shelf 2',
    },
    {
        title: 'Structure and Interpretation of Computer Programs',
        author: 'Harold Abelson, Gerald Sussman',
        isbn: '978-0262510875',
        totalCopies: 2,
        rackLocation: 'Section D, Shelf 3',
    },
    {
        title: 'Deep Learning',
        author: 'Ian Goodfellow, Yoshua Bengio',
        isbn: '978-0262035613',
        totalCopies: 3,
        rackLocation: 'Section E, Shelf 1',
    },
    {
        title: 'Machine Learning',
        author: 'Tom M. Mitchell',
        isbn: '978-0070428072',
        totalCopies: 3,
        rackLocation: 'Section E, Shelf 2',
    },
    {
        title: 'Python Crash Course',
        author: 'Eric Matthes',
        isbn: '978-1593279288',
        totalCopies: 5,
        rackLocation: 'Section E, Shelf 3',
    },
    {
        title: 'Cracking the Coding Interview',
        author: 'Gayle Laakmann McDowell',
        isbn: '978-0984782857',
        totalCopies: 4,
        rackLocation: 'Section F, Shelf 1',
    },
    {
        title: 'The C Programming Language',
        author: 'Brian Kernighan, Dennis Ritchie',
        isbn: '978-0131103627',
        totalCopies: 3,
        rackLocation: 'Section F, Shelf 2',
    },
    {
        title: 'Compiler Design: Principles, Techniques & Tools',
        author: 'Alfred Aho, Monica Lam',
        isbn: '978-0321486813',
        totalCopies: 3,
        rackLocation: 'Section F, Shelf 3',
    },
    {
        title: 'Linear Algebra and Its Applications',
        author: 'Gilbert Strang',
        isbn: '978-0030105678',
        totalCopies: 4,
        rackLocation: 'Section G, Shelf 1',
    },
    {
        title: 'Eloquent JavaScript',
        author: 'Marijn Haverbeke',
        isbn: '978-1593279509',
        totalCopies: 3,
        rackLocation: 'Section G, Shelf 2',
    },
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing books
        await Book.deleteMany({});
        console.log('Cleared existing books');

        // Insert sample books
        const books = await Book.insertMany(sampleBooks);
        console.log(`✅ Inserted ${books.length} sample books`);

        // Create a demo librarian if none exists
        const librarianExists = await User.findOne({ role: 'librarian' });
        if (!librarianExists) {
            await User.create({
                name: 'Library Admin',
                email: 'admin@iiitsurat.ac.in',
                password: 'admin123',
                role: 'librarian',
            });
            console.log('✅ Created demo librarian: admin@iiitsurat.ac.in / admin123');
        }

        // Create a demo student if none exists
        const studentExists = await User.findOne({ role: 'student' });
        if (!studentExists) {
            await User.create({
                name: 'Test Student',
                email: 'student@iiitsurat.ac.in',
                password: 'student123',
                role: 'student',
            });
            console.log('✅ Created demo student: student@iiitsurat.ac.in / student123');
        }

        console.log('\n🎉 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error.message);
        process.exit(1);
    }
};

seedDB();
