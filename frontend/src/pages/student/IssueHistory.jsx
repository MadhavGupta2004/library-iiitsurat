import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineBookOpen } from 'react-icons/hi';

const IssueHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/transactions/my');
                setTransactions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'issued':
                return <span className="badge-blue">Issued</span>;
            case 'returned':
                return <span className="badge-green">Returned</span>;
            case 'overdue':
                return <span className="badge-red">Overdue</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

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
                <h1 className="page-title">Issue History</h1>

                {transactions.length === 0 ? (
                    <div className="text-center py-16 text-surface-400">
                        <HiOutlineBookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No transaction history</p>
                        <p className="text-sm mt-1">Your issue and return records will appear here</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-6 py-4 text-left">Book</th>
                                    <th className="px-6 py-4 text-left">ISBN</th>
                                    <th className="px-6 py-4 text-left">Copy #</th>
                                    <th className="px-6 py-4 text-left">Issue Date</th>
                                    <th className="px-6 py-4 text-left">Due Date</th>
                                    <th className="px-6 py-4 text-left">Return Date</th>
                                    <th className="px-6 py-4 text-left">Fine</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-surface-800">
                                {transactions.map((t) => (
                                    <tr key={t._id} className="table-row">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {t.book?.image ? (
                                                    <img src={t.book.image} alt="" className="w-8 h-10 object-cover rounded" />
                                                ) : (
                                                    <div className="w-8 h-10 bg-primary-100 dark:bg-primary-900/30 rounded flex items-center justify-center">
                                                        <HiOutlineBookOpen className="w-4 h-4 text-primary-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-surface-900 dark:text-white text-sm">
                                                        {t.book?.title || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-surface-500">{t.book?.author}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                            {t.book?.isbn || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                            #{t.copyNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                            {new Date(t.issueDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                            {new Date(t.dueDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                            {t.returnDate
                                                ? new Date(t.returnDate).toLocaleDateString('en-IN')
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.fine > 0 ? (
                                                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                    ₹{t.fine}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-surface-400">₹0</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default IssueHistory;
