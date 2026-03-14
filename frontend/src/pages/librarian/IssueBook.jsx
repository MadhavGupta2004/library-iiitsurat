import { useState } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { HiOutlineBookOpen, HiOutlineSearch, HiOutlineUserGroup } from 'react-icons/hi';

const IssueBook = () => {
    const [bookSearch, setBookSearch] = useState('');
    const [bookResults, setBookResults] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [availableCopies, setAvailableCopies] = useState([]);
    const [copyLoading, setCopyLoading] = useState(false);
    const [selectedCopy, setSelectedCopy] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [issuing, setIssuing] = useState(false);

    const searchBooks = async () => {
        if (!bookSearch.trim()) return;
        try {
            const res = await api.get(`/books?limit=20&search=${encodeURIComponent(bookSearch.trim())}`);
            setBookResults(res.data.books || []);
            setSelectedBook(null);
            setAvailableCopies([]);
            setSelectedCopy('');
        } catch (err) {
            setBookResults([]);
        }
    };

    const selectBook = async (book) => {
        setSelectedBook(book);
        setSelectedCopy('');
        setCopyLoading(true);
        setAvailableCopies([]);
        try {
            const res = await api.get(`/books/available-copies/${book._id}`);
            setAvailableCopies(res.data.availableCopyNumbers || []);
            if (res.data.availableCopyNumbers?.length > 0) {
                setSelectedCopy(String(res.data.availableCopyNumbers[0]));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load copies');
            setAvailableCopies([]);
        } finally {
            setCopyLoading(false);
        }
    };

    const searchStudents = async () => {
        if (!studentSearch.trim()) {
            setStudentResults([]);
            return;
        }
        try {
            const res = await api.get('/students', { params: { search: studentSearch.trim() } });
            setStudentResults(res.data || []);
        } catch (err) {
            setStudentResults([]);
        }
    };

    const handleIssue = async () => {
        if (!selectedBook) {
            toast.error('Please select a book');
            return;
        }
        if (!selectedCopy) {
            toast.error('Please select a copy number');
            return;
        }
        if (!selectedStudent) {
            toast.error('Please search and select a student');
            return;
        }
        setIssuing(true);
        try {
            const res = await api.post('/transactions/issue', {
                bookId: selectedBook._id,
                copyNumber: parseInt(selectedCopy, 10),
                userId: selectedStudent._id,
            });
            toast.success(`Book issued to ${res.data.user?.name || selectedStudent.name}`);
            setSelectedBook(null);
            setAvailableCopies([]);
            setSelectedCopy('');
            setSelectedStudent(null);
            setStudentSearch('');
            setStudentResults([]);
            setBookSearch('');
            setBookResults([]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to issue book');
        } finally {
            setIssuing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl space-y-6">
                <h1 className="page-title">Issue Book</h1>
                <p className="text-surface-500 dark:text-surface-400 text-sm">
                    Search for a book, select a copy, choose a student, then click Issue.
                </p>

                {/* Book search */}
                <div className="card p-6">
                    <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
                        <HiOutlineBookOpen className="w-4 h-4" />
                        1. Search & select book
                    </h2>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={bookSearch}
                            onChange={(e) => setBookSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchBooks())}
                            placeholder="Search by title, author, or ISBN..."
                            className="input-field flex-1"
                        />
                        <button type="button" onClick={searchBooks} className="btn-primary shrink-0">
                            <HiOutlineSearch className="w-5 h-5" />
                        </button>
                    </div>
                    {bookResults.length > 0 && (
                        <ul className="max-h-48 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700">
                            {bookResults.map((b) => (
                                <li key={b._id}>
                                    <button
                                        type="button"
                                        onClick={() => selectBook(b)}
                                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedBook?._id === b._id
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                            : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                                            }`}
                                    >
                                        <span className="font-medium text-surface-900 dark:text-white">{b.title}</span>
                                        <span className="text-surface-500 ml-2">— {b.author}</span>
                                        <span className="block text-xs text-surface-400 mt-0.5">
                                            {b.availableCopies}/{b.totalCopies} available
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {selectedBook && (
                        <div className="mt-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                            <p className="font-medium text-surface-900 dark:text-white text-sm">{selectedBook.title}</p>
                            <p className="text-xs text-surface-500">{selectedBook.author} • ISBN: {selectedBook.isbn}</p>
                            {copyLoading ? (
                                <p className="text-xs text-surface-500 mt-2">Loading copies...</p>
                            ) : availableCopies.length === 0 ? (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-2">No copies available</p>
                            ) : (
                                <div className="mt-2">
                                    <label className="block text-xs font-medium text-surface-500 mb-1">Copy number</label>
                                    <select
                                        value={selectedCopy}
                                        onChange={(e) => setSelectedCopy(e.target.value)}
                                        className="input-field py-2 text-sm"
                                    >
                                        {availableCopies.map((n) => (
                                            <option key={n} value={n}>
                                                Copy #{n}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => { setSelectedBook(null); setAvailableCopies([]); setSelectedCopy(''); }}
                                className="text-xs text-surface-500 hover:text-red-600 mt-2"
                            >
                                Change book
                            </button>
                        </div>
                    )}
                </div>

                {/* Student search */}
                <div className="card p-6">
                    <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
                        <HiOutlineUserGroup className="w-4 h-4" />
                        2. Search & select student
                    </h2>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudents())}
                            onFocus={() => studentSearch.trim() && searchStudents()}
                            placeholder="Search by name or enrollment (e.g. Madhav or ui23ec33)"
                            className="input-field flex-1"
                        />
                        <button type="button" onClick={searchStudents} className="btn-primary shrink-0">
                            <HiOutlineSearch className="w-5 h-5" />
                        </button>
                    </div>
                    {selectedStudent ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                            <div>
                                <p className="font-medium text-surface-900 dark:text-white text-sm">{selectedStudent.name}</p>
                                <p className="text-xs text-surface-500">{selectedStudent.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                                className="text-xs text-surface-500 hover:text-red-600"
                            >
                                Change
                            </button>
                        </div>
                    ) : studentResults.length > 0 ? (
                        <ul className="max-h-40 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700">
                            {studentResults.map((s) => (
                                <li key={s._id}>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedStudent(s); setStudentSearch(s.name); setStudentResults([]); }}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-50 dark:hover:bg-surface-700"
                                    >
                                        <span className="font-medium text-surface-900 dark:text-white">{s.name}</span>
                                        <span className="text-surface-500 ml-2">{s.email}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                {/* Issue button */}
                <button
                    type="button"
                    onClick={handleIssue}
                    disabled={issuing || !selectedBook || !selectedCopy || !selectedStudent || availableCopies.length === 0}
                    className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {issuing ? 'Issuing...' : 'Issue book to student'}
                </button>
            </div>
        </DashboardLayout>
    );
};

export default IssueBook;
