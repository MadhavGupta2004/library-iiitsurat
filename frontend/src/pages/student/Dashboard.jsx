import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineExclamationCircle, HiOutlineCurrencyRupee } from 'react-icons/hi';

const StudentDashboard = () => {
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsRes, transRes] = await Promise.all([
                    api.get('/transactions/stats'),
                    api.get('/transactions/my'),
                ]);
                setStats(statsRes.data);
                setTransactions(transRes.data.filter((t) => t.status !== 'returned').slice(0, 5));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [location.key]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    const statCards = [
        {
            label: 'Books Issued',
            value: stats?.issuedBooks || 0,
            icon: HiOutlineBookOpen,
            color: 'text-primary-600 dark:text-primary-400',
            bg: 'bg-primary-50 dark:bg-primary-900/20',
        },
        {
            label: 'Books Returned',
            value: stats?.returnedBooks || 0,
            icon: HiOutlineClock,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        },
        {
            label: 'Overdue',
            value: stats?.overdueCount || 0,
            icon: HiOutlineExclamationCircle,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
        },
        {
            label: 'Total Fine',
            value: `₹${stats?.totalFine || 0}`,
            icon: HiOutlineCurrencyRupee,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            action: stats?.totalFine > 0 && (
                <Link
                    to="/student/pay-fine"
                    className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-lg hover:bg-amber-600 transition-colors mt-2 block w-fit"
                >
                    Pay Now
                </Link>
            )
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="page-title">Student Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                                    {stat.label}
                                </span>
                                <div className={`p-2 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <span className="text-3xl font-bold text-surface-900 dark:text-white">
                                {stat.value}
                            </span>
                            {stat.action}
                        </div>
                    ))}
                </div>

                {/* Current Issues */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                            Currently Issued Books
                        </h2>
                        <Link to="/student/history" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                            View all →
                        </Link>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-surface-400">
                            <HiOutlineBookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No books currently issued</p>
                            <Link to="/student/books" className="text-primary-600 dark:text-primary-400 text-sm hover:underline mt-2 inline-block">
                                Browse books →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((t) => (
                                <div
                                    key={t._id}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 transition-all duration-200 hover:shadow-md"
                                >
                                    {t.book?.image ? (
                                        <img
                                            src={t.book.image}
                                            alt={t.book.title}
                                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-12 h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
                                            <HiOutlineBookOpen className="w-6 h-6 text-primary-500" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                                            {t.book?.title || 'Unknown Book'}
                                        </h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                            {t.book?.author}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-surface-500 dark:text-surface-400">Due Date</p>
                                        <p className={`text-sm font-medium ${new Date(t.dueDate) < new Date()
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-surface-700 dark:text-surface-300'
                                            }`}>
                                            {new Date(t.dueDate).toLocaleDateString('en-IN')}
                                        </p>
                                        {t.fine > 0 && (
                                            <span className="badge-red text-xs mt-1">Fine: ₹{t.fine}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
