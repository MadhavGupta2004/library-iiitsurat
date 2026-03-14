import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineCurrencyRupee } from 'react-icons/hi';

const FineCollection = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFines = async () => {
            try {
                const res = await api.get('/transactions/fines');
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFines();
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

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="page-title">Fine Collection</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="stat-card">
                        <span className="text-sm font-medium text-surface-500 dark:text-surface-400">Total Collected</span>
                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{data?.totalCollected || 0}
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="text-sm font-medium text-surface-500 dark:text-surface-400">Pending Fines</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                            ₹{data?.totalPending || 0}
                        </span>
                    </div>
                </div>

                {/* Paid Fines Table */}
                {data?.paidFines?.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Collected Fines</h2>
                        <div className="table-container">
                            <table className="w-full">
                                <thead>
                                    <tr className="table-header">
                                        <th className="px-6 py-4 text-left">Student</th>
                                        <th className="px-6 py-4 text-left">Book</th>
                                        <th className="px-6 py-4 text-left">Return Date</th>
                                        <th className="px-6 py-4 text-right">Fine</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-surface-800">
                                    {data.paidFines.map((t) => (
                                        <tr key={t._id} className="table-row">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-surface-900 dark:text-white text-sm">{t.user?.name}</p>
                                                <p className="text-xs text-surface-500">{t.user?.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-surface-700 dark:text-surface-300">{t.book?.title}</td>
                                            <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                                {new Date(t.returnDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{t.fine}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pending Fines */}
                {data?.pendingFines?.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-3">Pending Fines</h2>
                        <div className="table-container">
                            <table className="w-full">
                                <thead>
                                    <tr className="table-header">
                                        <th className="px-6 py-4 text-left">Student</th>
                                        <th className="px-6 py-4 text-left">Book</th>
                                        <th className="px-6 py-4 text-left">Due Date</th>
                                        <th className="px-6 py-4 text-right">Fine</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-surface-800">
                                    {data.pendingFines.map((t) => (
                                        <tr key={t._id} className="table-row">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-surface-900 dark:text-white text-sm">{t.user?.name}</p>
                                                <p className="text-xs text-surface-500">{t.user?.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-surface-700 dark:text-surface-300">{t.book?.title}</td>
                                            <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 font-medium">
                                                {new Date(t.dueDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400">₹{t.fine}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(data?.paidFines?.length === 0 && data?.pendingFines?.length === 0) && (
                    <div className="text-center py-16 text-surface-400">
                        <HiOutlineCurrencyRupee className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No fine records</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default FineCollection;
