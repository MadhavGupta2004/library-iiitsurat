import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineQrcode, HiOutlineBookOpen } from 'react-icons/hi';

const ManageBooks = () => {
    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [qrModal, setQrModal] = useState(null);

    const fetchBooks = async (p = 1, s = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/books?page=${p}&limit=10&search=${s}`);
            setBooks(res.data.books);
            setTotalPages(res.data.pages);
            setPage(res.data.page);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
        try {
            await api.delete(`/books/${id}`);
            toast.success('Book deleted');
            fetchBooks(page, search);
        } catch (err) {
            toast.error('Failed to delete book');
        }
    };

    const handleGenerateQR = async (bookId, copyNumber) => {
        try {
            const res = await api.get(`/books/qr/${bookId}/${copyNumber}`);
            setQrModal({ image: res.data.qrImage, data: res.data.qrData });
        } catch (err) {
            toast.error('Failed to generate QR');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="page-title">Manage Books</h1>
                    <Link to="/librarian/add-book" className="btn-primary text-sm">
                        + Add New Book
                    </Link>
                </div>

                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        fetchBooks(1, e.target.value);
                    }}
                    placeholder="Search books..."
                    className="input-field max-w-md"
                />

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                ) : books.length === 0 ? (
                    <div className="text-center py-16 text-surface-400">
                        <HiOutlineBookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No books found</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-6 py-4 text-left">Book</th>
                                    <th className="px-6 py-4 text-left">ISBN</th>
                                    <th className="px-6 py-4 text-left">Rack</th>
                                    <th className="px-6 py-4 text-center">Copies</th>
                                    <th className="px-6 py-4 text-center">Available</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-surface-800">
                                {books.map((book) => (
                                    <tr key={book._id} className="table-row">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {book.image ? (
                                                    <img src={book.image} alt="" className="w-10 h-12 object-cover rounded-lg" />
                                                ) : (
                                                    <div className="w-10 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                                        <HiOutlineBookOpen className="w-5 h-5 text-primary-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-surface-900 dark:text-white">{book.title}</p>
                                                    <p className="text-sm text-surface-500">{book.author}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">{book.isbn}</td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">{book.rackLocation}</td>
                                        <td className="px-6 py-4 text-center text-sm font-medium">{book.totalCopies}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={book.availableCopies > 0 ? 'badge-green' : 'badge-red'}>
                                                {book.availableCopies}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/librarian/edit-book/${book._id}`}
                                                    className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
                                                    title="Edit"
                                                >
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </Link>

                                                {/* QR dropdown */}
                                                <div className="relative group">
                                                    <button
                                                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 transition-colors"
                                                        title="Generate QR"
                                                    >
                                                        <HiOutlineQrcode className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl py-2 z-10 hidden group-hover:block min-w-[140px]">
                                                        {Array.from({ length: book.totalCopies }, (_, i) => i + 1).map((copy) => (
                                                            <button
                                                                key={copy}
                                                                onClick={() => handleGenerateQR(book._id, copy)}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
                                                            >
                                                                Copy #{copy}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDelete(book._id, book.title)}
                                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => fetchBooks(p, search)}
                                className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${p === page
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}

                {/* QR Modal */}
                {qrModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setQrModal(null)}>
                        <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-center mb-4 text-surface-900 dark:text-white">Book QR Code</h3>
                            <img src={qrModal.image} alt="QR Code" className="w-64 h-64 mx-auto rounded-xl" />
                            <p className="text-xs text-surface-500 text-center mt-4 break-all">{qrModal.data}</p>
                            <button onClick={() => setQrModal(null)} className="w-full btn-primary mt-4">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManageBooks;
