import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineBookOpen } from 'react-icons/hi';

function formatFineForRow(t) {
    const late = Number(t.lateReturnFine) || 0;
    const outstanding = Number(t.fine) || 0;
    if (t.status === 'returned' && late > 0) {
        if (outstanding > 0) {
            return (
                <div className="text-sm">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">₹{late}</span>
                    <p className="text-xs text-surface-500 mt-0.5">Unpaid (this copy)</p>
                </div>
            );
        }
        return (
            <div className="text-sm">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{late} paid</span>
                <p className="text-xs text-surface-500 mt-0.5">Late return — included in a library payment</p>
            </div>
        );
    }
    if (t.status === 'overdue') {
        return (
            <div className="text-sm">
                <span className="font-semibold text-red-600 dark:text-red-400">₹{outstanding}</span>
                <p className="text-xs text-surface-500 mt-0.5">Accruing until you return</p>
            </div>
        );
    }
    if (t.status === 'returned' && late === 0) {
        return <span className="text-sm text-surface-400">On time (no late fee)</span>;
    }
    return <span className="text-sm text-surface-400">—</span>;
}

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
                    <div className="space-y-3">
                        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-3xl">
                            Late-return fees are <span className="font-medium">per book</span> (₹5 per day after the due
                            date). After you pay at the library, each returned copy shows the amount for{' '}
                            <span className="font-medium">that book</span> as paid. For combined totals, see{' '}
                            <Link to="/student/payments" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                                Payment history
                            </Link>
                            .
                        </p>
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
                                    <th className="px-6 py-4 text-left">Fine for this book</th>
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
                                        <td className="px-6 py-4 max-w-[200px]">{formatFineForRow(t)}</td>
                                        <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default IssueHistory;
