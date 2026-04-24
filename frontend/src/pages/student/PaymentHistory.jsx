import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineDocumentDownload, HiOutlineCurrencyRupee, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/payment/history');
                setPayments(res.data);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load payment history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const downloadReceipt = async (paymentId) => {
        try {
            const response = await api.get(`/payment/receipt/${paymentId}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt_${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Failed to download receipt');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'failed':
                return <HiOutlineXCircle className="w-5 h-5 text-red-500" />;
            default:
                return <HiOutlineClock className="w-5 h-5 text-amber-500" />;
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
                <h1 className="page-title">Payment History</h1>

                {payments.length === 0 ? (
                    <div className="text-center py-16 text-surface-400">
                        <HiOutlineCurrencyRupee className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No payment history</p>
                        <p className="text-sm mt-1">Your past fine payments will appear here</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-left">Amount</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-left">Method</th>
                                    <th className="px-6 py-4 text-left">Transaction ID</th>
                                    <th className="px-6 py-4 text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-surface-800">
                                {payments.map((p) => (
                                    <tr key={p._id} className="table-row">
                                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                            {new Date(p.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-surface-900 dark:text-white">
                                            ₹{p.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 capitalize text-sm font-medium">
                                                {getStatusIcon(p.status)}
                                                <span className={
                                                    p.status === 'success' ? 'text-emerald-600' :
                                                        p.status === 'failed' ? 'text-red-600' :
                                                            'text-amber-600'
                                                }>
                                                    {p.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm capitalize text-surface-600 dark:text-surface-300">
                                            {p.paymentMethod}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-surface-500">
                                            {p.razorpayPaymentId || (p.paymentMethod === 'upi' ? String(p._id) : '—')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {p.status === 'success' && (
                                                <button
                                                    onClick={() => downloadReceipt(p._id)}
                                                    className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-colors"
                                                    title="Download Receipt"
                                                >
                                                    <HiOutlineDocumentDownload className="w-5 h-5" />
                                                </button>
                                            )}
                                        </td>
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

export default PaymentHistory;
