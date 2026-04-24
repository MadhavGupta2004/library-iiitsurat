import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineCurrencyRupee, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineDuplicate } from 'react-icons/hi';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const PaymentPage = () => {
    const [fine, setFine] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [session, setSession] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState('');

    const fetchFine = useCallback(async () => {
        try {
            const res = await api.get('/transactions/stats');
            setFine(res.data.totalFine || 0);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch fine details');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFine();
    }, [fetchFine]);

    useEffect(() => {
        if (session?.upiString) {
            QRCode.toDataURL(session.upiString, { width: 220, margin: 2 })
                .then(setQrDataUrl)
                .catch(() => setQrDataUrl(''));
        } else {
            setQrDataUrl('');
        }
    }, [session]);

    const handlePayNow = async () => {
        try {
            setBusy(true);
            const res = await api.post('/payment/create-upi-intent');
            setSession(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not start payment');
        } finally {
            setBusy(false);
        }
    };

    const copyText = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            toast.error('Could not copy');
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
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="page-title">Fine Payment</h1>

                <div className="card p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto">
                        <HiOutlineCurrencyRupee className="w-12 h-12 text-amber-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Outstanding Balance</h2>
                        <p className="text-surface-500 dark:text-surface-400 mt-1">
                            Pay with any UPI app by scanning the QR or using the UPI ID below. The librarian will confirm
                            when the payment is received.
                        </p>
                    </div>

                    <div className="text-5xl font-black text-surface-900 dark:text-white">₹{fine}</div>

                    <div className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-2xl border border-surface-200 dark:border-surface-700 text-left space-y-3">
                        <div className="flex items-start gap-3">
                            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-surface-600 dark:text-surface-300">Fine is cleared in the app after the librarian confirms</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-surface-600 dark:text-surface-300">Use the exact amount shown when paying</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-surface-600 dark:text-surface-300">PDF receipt available from payment history after confirmation</p>
                        </div>
                    </div>

                    {!session && (
                        <button
                            onClick={handlePayNow}
                            disabled={fine === 0 || busy}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                                fine === 0
                                    ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
                                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40'
                            }`}
                        >
                            {busy ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Loading…
                                </>
                            ) : fine === 0 ? (
                                'No Fine Due'
                            ) : (
                                'Pay Now'
                            )}
                        </button>
                    )}

                    {session && (
                        <div className="space-y-4 text-left">
                            <p className="text-sm text-center text-surface-500">
                                Pay <span className="font-bold text-surface-900 dark:text-white">₹{session.amount}</span> to{' '}
                                <span className="font-medium">{session.payeeName}</span>
                            </p>
                            {qrDataUrl && (
                                <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700">
                                    <img src={qrDataUrl} alt="UPI QR code" className="w-[220px] h-[220px]" />
                                    <a
                                        href={session.upiString}
                                        className="text-sm font-semibold text-primary-600 hover:underline"
                                    >
                                        Open in UPI app (phone)
                                    </a>
                                </div>
                            )}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-surface-500 uppercase">UPI ID (VPA)</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <code className="text-sm font-mono bg-surface-100 dark:bg-surface-800 px-3 py-2 rounded-lg flex-1 min-w-0 break-all">
                                        {session.upiId}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => copyText(session.upiId, 'UPI ID')}
                                        className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700"
                                        title="Copy UPI ID"
                                    >
                                        <HiOutlineDuplicate className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-amber-700 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                                After you pay, visit the library desk or message staff so they can click &quot;Confirm
                                received&quot; in the admin panel. Your fine updates only after they confirm.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSession(null);
                                    fetchFine();
                                }}
                                className="w-full py-3 rounded-xl font-medium text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800/80"
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {fine > 0 && !session && (
                        <p className="text-xs text-surface-500 mt-4 flex items-center justify-center gap-1.5">
                            <HiOutlineExclamationCircle className="w-4 h-4" />
                            Fine is calculated at ₹5 per day for overdue books
                        </p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PaymentPage;
