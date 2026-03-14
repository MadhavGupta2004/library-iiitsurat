import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import { HiOutlineCurrencyRupee, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

const PaymentPage = () => {
    const [fine, setFine] = useState(0);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFine = async () => {
            try {
                const res = await api.get('/transactions/stats');
                setFine(res.data.totalFine || 0);
            } catch (err) {
                console.error(err);
                toast.error('Failed to fetch fine details');
            } finally {
                setLoading(false);
            }
        };
        fetchFine();
    }, []);

    const handlePayment = async () => {
        try {
            setVerifying(true);
            const res = await api.post('/api/payment/create-order');
            const data = res.data;

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "IIIT Surat Library",
                description: "Library Fine Payment",
                order_id: data.orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/api/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        toast.success('Payment successful!');
                        navigate('/student/payments');
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Verification failed');
                    }
                },
                prefill: {
                    name: "", // Will be filled from auth if available
                    email: "",
                },
                theme: {
                    color: "#0f172a",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error('Payment failed: ' + response.error.description);
            });
            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not initiate payment');
        } finally {
            setVerifying(false);
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
                        <p className="text-surface-500 dark:text-surface-400 mt-1">Pay your library fine securely via Razorpay</p>
                    </div>

                    <div className="text-5xl font-black text-surface-900 dark:text-white">
                        ₹{fine}
                    </div>

                    <div className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-2xl border border-surface-200 dark:border-surface-700 text-left space-y-3">
                        <div className="flex items-start gap-3">
                            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-surface-600 dark:text-surface-300">Instant fine clearance upon successful payment</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-surface-600 dark:text-surface-300">Secure transaction with Razorpay signature verification</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-surface-600 dark:text-surface-300">Downloadable PDF receipt for your records</p>
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={fine === 0 || verifying}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${fine === 0
                                ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40'
                            }`}
                    >
                        {verifying ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : fine === 0 ? (
                            'No Fine Due'
                        ) : (
                            'Pay Now via Razorpay'
                        )}
                    </button>

                    {fine > 0 && (
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
