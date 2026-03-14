import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineSearch, HiOutlineBookOpen, HiOutlineLocationMarker, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const BookSearch = () => {
    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchBooks = async (p = 1, s = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/books?page=${p}&limit=9&search=${s}`);
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

    const handleSearch = (e) => {
        e.preventDefault();
        fetchBooks(1, search);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="page-title">Search Books</h1>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="relative">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title, author, or ISBN..."
                        className="input-field pl-12 pr-24"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-4 text-sm"
                    >
                        Search
                    </button>
                </form>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                ) : books.length === 0 ? (
                    <div className="text-center py-16 text-surface-400">
                        <HiOutlineBookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No books found</p>
                        <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                ) : (
                    <>
                        {/* Book Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {books.map((book, i) => (
                                <div
                                    key={book._id}
                                    className="card overflow-hidden group animate-slide-up"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    {/* Book Image */}
                                    <div className="h-48 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 relative overflow-hidden">
                                        {book.image ? (
                                            <img
                                                src={book.image}
                                                alt={book.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <HiOutlineBookOpen className="w-16 h-16 text-primary-300 dark:text-primary-700" />
                                            </div>
                                        )}
                                        {/* Availability Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span
                                                className={`badge ${book.availableCopies > 0
                                                        ? 'badge-green'
                                                        : 'badge-red'
                                                    }`}
                                            >
                                                {book.availableCopies > 0
                                                    ? `${book.availableCopies} available`
                                                    : 'Unavailable'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Book Info */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-surface-900 dark:text-white text-lg mb-1 line-clamp-1">
                                            {book.title}
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                                            by {book.author}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-surface-400 dark:text-surface-500 mb-4">
                                            <span>ISBN: {book.isbn}</span>
                                            <span className="flex items-center gap-1">
                                                <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                                                {book.rackLocation}
                                            </span>
                                        </div>

                                        {/* Progress bar for availability */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-surface-500 mb-1">
                                                <span>Availability</span>
                                                <span>{book.availableCopies}/{book.totalCopies}</span>
                                            </div>
                                            <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${book.availableCopies === 0
                                                            ? 'bg-red-500'
                                                            : book.availableCopies <= book.totalCopies * 0.3
                                                                ? 'bg-amber-500'
                                                                : 'bg-emerald-500'
                                                        }`}
                                                    style={{
                                                        width: `${(book.availableCopies / book.totalCopies) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div
                                            className={`w-full py-2.5 rounded-xl text-center text-sm font-medium ${book.availableCopies > 0
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
                                            }`}
                                        >
                                            {book.availableCopies > 0 ? 'Available at library' : 'Not available'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <button
                                    onClick={() => fetchBooks(page - 1, search)}
                                    disabled={page <= 1}
                                    className="btn-secondary py-2 px-3 text-sm disabled:opacity-40"
                                >
                                    <HiOutlineChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => fetchBooks(p, search)}
                                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${p === page
                                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => fetchBooks(page + 1, search)}
                                    disabled={page >= totalPages}
                                    className="btn-secondary py-2 px-3 text-sm disabled:opacity-40"
                                >
                                    <HiOutlineChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BookSearch;
