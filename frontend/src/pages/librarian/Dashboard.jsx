import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineBookOpen, HiOutlineUsers, HiOutlineClipboardCheck, HiOutlineExclamationCircle, HiOutlineCurrencyRupee } from 'react-icons/hi';

const LibrarianDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/transactions/stats');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

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
            label: 'Total Books',
            value: stats?.totalBooks || 0,
            icon: HiOutlineBookOpen,
            color: 'text-primary-600 dark:text-primary-400',
            bg: 'bg-primary-50 dark:bg-primary-900/20',
            gradient: 'from-primary-500 to-primary-600',
        },
        {
            label: 'Registered Students',
            value: stats?.totalUsers || 0,
            icon: HiOutlineUsers,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            gradient: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Active Issues',
            value: stats?.activeIssues || 0,
            icon: HiOutlineClipboardCheck,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            gradient: 'from-emerald-500 to-emerald-600',
        },
        {
            label: 'Overdue Books',
            value: stats?.overdueCount || 0,
            icon: HiOutlineExclamationCircle,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
            gradient: 'from-red-500 to-red-600',
        },
        {
            label: 'Fines Collected',
            value: `₹${stats?.totalFinesCollected || 0}`,
            icon: HiOutlineCurrencyRupee,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            gradient: 'from-amber-500 to-amber-600',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="page-title">Librarian Dashboard</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {statCards.map((stat, i) => (
                        <div
                            key={i}
                            className="stat-card animate-slide-up group hover:shadow-lg"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                                    {stat.label}
                                </span>
                                <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-200`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <span className="text-3xl font-bold text-surface-900 dark:text-white">
                                {stat.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LibrarianDashboard;
