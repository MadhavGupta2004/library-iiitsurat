import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlineSearch, HiOutlineBookOpen, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [booksModal, setBooksModal] = useState(null);
    const [issuedBooks, setIssuedBooks] = useState(null);
    const [booksLoading, setBooksLoading] = useState(false);
    const [returningId, setReturningId] = useState(null);

    const fetchStudents = async (searchTerm = null) => {
        const term = searchTerm !== null ? searchTerm : search;
        setLoading(true);
        try {
            const params = term && String(term).trim() ? { search: String(term).trim() } : {};
            const res = await api.get('/students', { params });
            setStudents(res.data);
        } catch (err) {
            console.error(err);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchStudents();
    };

    const fetchIssuedBooksForStudent = async (studentId, useCacheBust = true) => {
        if (!studentId) return null;
        const url = useCacheBust
            ? `/students/${studentId}/issued-books?t=${Date.now()}`
            : `/students/${studentId}/issued-books`;
        const res = await api.get(url);
        return res.data;
    };

    const openBooksModal = async (student) => {
        setBooksModal(student);
        setIssuedBooks(null);
        setBooksLoading(true);
        try {
            const data = await fetchIssuedBooksForStudent(student._id);
            setIssuedBooks(data || { student: { name: student.name, email: student.email, enrollmentNumber: student.enrollmentNumber }, issuedBooks: [] });
            fetchStudents(search);
        } catch (err) {
            console.error(err);
            setIssuedBooks({ student: { name: student.name, email: student.email, enrollmentNumber: student.enrollmentNumber }, issuedBooks: [] });
        } finally {
            setBooksLoading(false);
        }
    };

    const refetchIssuedBooks = async () => {
        if (!booksModal) return;
        setBooksLoading(true);
        try {
            const data = await fetchIssuedBooksForStudent(booksModal._id);
            if (data) setIssuedBooks(data);
            fetchStudents(search);
        } catch (err) {
            console.error(err);
        } finally {
            setBooksLoading(false);
        }
    };

    const handleMarkReturned = async (item) => {
        if (!item?.book?._id) return;
        setReturningId(item._id);
        try {
            const res = await api.post('/transactions/return', {
                bookId: item.book._id,
                copyNumber: item.copyNumber,
            });
            const fine = res.data.fine || 0;
            if (fine > 0) {
                toast.success(`Book returned. Fine to pay: ₹${fine}`);
            } else {
                toast.success('Book marked as returned.');
            }
            await refetchIssuedBooks();
            fetchStudents(search);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to return book');
        } finally {
            setReturningId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="page-title">All Students</h1>

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                        <input
                            type="text"
                            placeholder="Search by name or enrollment number (e.g. Madhav or ui23ec33)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        Search
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                fetchStudents('');
                            }}
                            className="btn-secondary"
                        >
                            Clear
                        </button>
                    )}
                </form>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-16 text-surface-400">
                        <HiOutlineUserGroup className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No students found</p>
                        <p className="text-sm mt-1">
                            {search ? 'Try a different name or enrollment number.' : 'No students have registered yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-6 py-4 text-left">Name</th>
                                    <th className="px-6 py-4 text-left">Enrollment No.</th>
                                    <th className="px-6 py-4 text-left">Email</th>
                                    <th className="px-6 py-4 text-center">Books Issued</th>
                                    <th className="px-6 py-4 text-right">Fine (₹)</th>
                                    <th className="px-6 py-4 text-center">Books</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-surface-800">
                                {students.map((s) => (
                                    <tr key={s._id} className="table-row">
                                        <td className="px-6 py-4 font-medium text-surface-900 dark:text-white">
                                            {s.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300 font-mono">
                                            {s.enrollmentNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                            {s.email}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-sm font-medium ${
                                                    s.booksIssued > 0
                                                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                        : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                                                }`}
                                            >
                                                {s.booksIssued}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={
                                                    s.fineAmount > 0
                                                        ? 'text-red-600 dark:text-red-400 font-semibold'
                                                        : 'text-surface-500 dark:text-surface-400'
                                                }
                                            >
                                                ₹{s.fineAmount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => openBooksModal(s)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors"
                                            >
                                                <HiOutlineBookOpen className="w-4 h-4" />
                                                View books
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal: Student's issued books */}
                {booksModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setBooksModal(null)}>
                        <div
                            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                        Books issued to {issuedBooks?.student?.name ?? booksModal.name}
                                    </h2>
                                    <p className="text-sm text-surface-500 dark:text-surface-400">
                                        {issuedBooks?.student?.enrollmentNumber ?? booksModal.enrollmentNumber} • {issuedBooks?.student?.email ?? booksModal.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => refetchIssuedBooks()}
                                        disabled={booksLoading}
                                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 disabled:opacity-50"
                                        title="Refresh list"
                                    >
                                        <HiOutlineRefresh className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBooksModal(null)}
                                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                                    >
                                        <HiOutlineX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {booksLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                    </div>
                                ) : !issuedBooks?.issuedBooks?.length ? (
                                    <div className="text-center py-12 text-surface-500 dark:text-surface-400">
                                        <HiOutlineBookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No books currently issued</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-4">
                                        {issuedBooks.issuedBooks.map((item) => (
                                            <li
                                                key={item._id}
                                                className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-700/30"
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-surface-900 dark:text-white">{item.book?.title}</p>
                                                        <p className="text-sm text-surface-500 dark:text-surface-400">{item.book?.author}</p>
                                                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                                                            <span className="text-surface-600 dark:text-surface-300">ISBN: {item.book?.isbn ?? '—'}</span>
                                                            <span className="text-surface-600 dark:text-surface-300">Copy #{item.copyNumber}</span>
                                                            <span className="text-surface-600 dark:text-surface-300">
                                                                Issued: {new Date(item.issueDate).toLocaleDateString('en-IN')}
                                                            </span>
                                                            <span className={item.isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-surface-600 dark:text-surface-300'}>
                                                                Due: {new Date(item.dueDate).toLocaleDateString('en-IN')}
                                                                {item.isOverdue && ' (Overdue)'}
                                                            </span>
                                                            {item.fine > 0 && (
                                                                <span className="text-red-600 dark:text-red-400 font-medium">Fine: ₹{item.fine}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkReturned(item)}
                                                        disabled={returningId === item._id}
                                                        className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 disabled:opacity-50"
                                                    >
                                                        {returningId === item._id ? '...' : 'Mark returned'}
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Students;
