import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineCurrencyRupee, HiOutlineDownload, HiOutlineCheck, HiOutlineUser } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        studentId: '',
        startDate: '',
        endDate: ''
    });
    const [stats, setStats] = useState({
        totalCollected: 0,
        pendingOrders: 0
    });

    useEffect(() => {
        fetchPayments();
    }, [filters]);

    const fetchPayments = async () => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const res = await api.get(`/api/payment/all?${queryParams}`);
            setPayments(res.data);

            // Calculate stats
            const collected = res.data
                .filter(p => p.status === 'success')
                .reduce((sum, p) => sum + p.amount, 0);
            const pending = res.data.filter(p => p.status === 'pending').length;

            setStats({ totalCollected: collected, pendingOrders: pending });
        } catch (err) {
            console.error(err);
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/api/payment/export', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'all_payments.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Failed to export CSV');
        }
    };

    const markPaidManually = async (userId, amount) => {
        if (!window.confirm(`Mark fine of ₹${amount} as paid for this student?`)) return;

        try {
            await api.post('/api/payment/mark-paid', { userId, amount });
            toast.success('Fine marked as paid');
            fetchPayments();
        } catch (err) {
            toast.error('Operation failed');
        }
    };

    if (loading && payments.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="page-title">Payment Overview</h1>
                    <button
                        onClick={handleExport}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <HiOutlineDownload className="w-5 h-5" />
                        Export CSV
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-surface-500">Total Collected</span>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <HiOutlineCurrencyRupee className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-surface-900 dark:text-white">₹{stats.totalCollected}</span>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-surface-500">Pending Orders</span>
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <HiOutlineFilter className="w-5 h-5 text-amber-500" />
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-surface-900 dark:text-white">{stats.pendingOrders}</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs font-semibold text-surface-400 uppercase mb-1 block">Status</label>
                        <select
                            className="input-field text-sm"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Statuses</option>
                            <option value="success">Success</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-surface-400 uppercase mb-1 block">Start Date</label>
                        <input
                            type="date"
                            className="input-field text-sm"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-surface-400 uppercase mb-1 block">End Date</label>
                        <input
                            type="date"
                            className="input-field text-sm"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={() => setFilters({ status: '', studentId: '', startDate: '', endDate: '' })}
                        className="text-sm text-primary-600 font-medium hover:underline pb-2"
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Payments Table */}
                <div className="table-container">
                    <table className="w-full">
                        <thead>
                            <tr className="table-header">
                                <th className="px-6 py-4 text-left">Student</th>
                                <th className="px-6 py-4 text-left">Amount</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Method</th>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-surface-800">
                            {payments.map((p) => (
                                <tr key={p._id} className="table-row">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-500">
                                                <HiOutlineUser className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-surface-900 dark:text-white text-sm">{p.user?.name || 'Deleted User'}</p>
                                                <p className="text-xs text-surface-500">{p.user?.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-surface-900 dark:text-white">
                                        ₹{p.amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`badge ${p.status === 'success' ? 'badge-green' :
                                                p.status === 'failed' ? 'badge-red' :
                                                    'badge-blue'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm capitalize text-surface-600 dark:text-surface-300">
                                        {p.paymentMethod}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {p.status === 'pending' && (
                                            <button
                                                onClick={() => markPaidManually(p.user?._id, p.amount)}
                                                className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-tight"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {payments.length === 0 && (
                        <div className="text-center py-12 text-surface-400 bg-white dark:bg-surface-800">
                            No records found
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminPayments;
