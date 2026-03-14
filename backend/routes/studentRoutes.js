const express = require('express');
const router = express.Router();
const { getStudents, getStudentIssuedBooks } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('librarian'), getStudents);
router.get('/:id/issued-books', protect, authorize('librarian'), getStudentIssuedBooks);

module.exports = router;
