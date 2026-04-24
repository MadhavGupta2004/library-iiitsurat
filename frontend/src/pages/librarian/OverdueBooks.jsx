import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

const OverdueBooks = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOverdue = async () => {
        try {
            setLoading(true);
            const res = await api.get('/transactions/overdue');
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverdue();
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
                <h1 className="page-title">Overdue Books</h1>
                <p className="text-sm text-surface-500 max-w-2xl">
                    All loans past the due date that are still with the student. The dashboard <span className="font-medium">Overdue</span>{' '}
                    count only includes copies where a <span className="font-medium">late fee is still due</span>. A row
                    with <span className="font-medium">₹0</span> means the accrual was paid — the copy may still be out for
                    return.
                </p>

                {transactions.length === 0 ? (
                    <div className="text-center py-16 text-surface-400">
                        <HiOutlineExclamationCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No overdue books!</p>
                        <p className="text-sm mt-1">All books are returned on time 🎉</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-6 py-4 text-left">Student</th>
                                    <th className="px-6 py-4 text-left">Book</th>
                                    <th className="px-6 py-4 text-left">Copy #</th>
                                    <th className="px-6 py-4 text-left">Due Date</th>
                                    <th className="px-6 py-4 text-left">Days Overdue</th>
                                    <th className="px-6 py-4 text-right">Fine</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-surface-800">
                                {transactions.map((t) => {
                                    const daysOverdue = Math.ceil(
                                        (new Date() - new Date(t.dueDate)) / (1000 * 60 * 60 * 24)
                                    );
                                    return (
                                        <tr key={t._id} className="table-row">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-surface-900 dark:text-white text-sm">{t.user?.name}</p>
                                                <p className="text-xs text-surface-500">{t.user?.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-surface-900 dark:text-white text-sm">{t.book?.title}</p>
                                                <p className="text-xs text-surface-500">{t.book?.author}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">#{t.copyNumber}</td>
                                            <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 font-medium">
                                                {new Date(t.dueDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="badge-red">{daysOverdue} days</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm">
                                                {t.lateFeeClearedByPayment || t.fine === 0 ? (
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0</span>
                                                ) : (
                                                    <span className="font-bold text-red-600 dark:text-red-400">₹{t.fine}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default OverdueBooks;
