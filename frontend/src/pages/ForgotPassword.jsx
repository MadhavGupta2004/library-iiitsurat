import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
    HiOutlineBookOpen,
    HiOutlineMail,
    HiOutlineSun,
    HiOutlineMoon,
} from 'react-icons/hi';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { darkMode, toggleDarkMode } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.endsWith('@iiitsurat.ac.in')) {
            toast.error('Only @iiitsurat.ac.in emails are allowed');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            toast.success(data.message || 'Check your email');
            setSent(true);
        } catch (err) {
            const d = err.response?.data;
            const extra = d?.detail ? ` — ${d.detail}` : '';
            toast.error((d?.message || 'Something went wrong') + extra, {
                duration: 8000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-surface-900 to-accent-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse-soft"></div>
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-soft delay-1000"></div>
            </div>

            <button
                type="button"
                onClick={toggleDarkMode}
                className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200 z-10"
            >
                {darkMode ? (
                    <HiOutlineSun className="w-5 h-5 text-amber-300" />
                ) : (
                    <HiOutlineMoon className="w-5 h-5 text-white" />
                )}
            </button>

            <div className="relative z-10 w-full max-w-md px-6 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-lg">
                        <HiOutlineBookOpen className="w-9 h-9 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Forgot password</h1>
                    <p className="text-surface-400 text-sm">
                        Enter your institute email. We will send a reset link if an account exists.
                    </p>
                    <p className="text-surface-500 text-xs mt-3 max-w-sm mx-auto leading-relaxed">
                        The link in the email works from <strong className="text-surface-400">any device and any network</strong>{' '}
                        when the app is deployed (e.g. Render) so the link uses your public website address. Local-only
                        <code className="mx-1 text-surface-400"> localhost </code>
                        links only work on the computer running the dev server.
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {sent ? (
                        <div className="text-surface-300 text-sm leading-relaxed space-y-3">
                            <p>
                                If that address is <strong className="text-surface-200">registered</strong> on this
                                library site, a reset link was sent. Check <strong className="text-surface-200">inbox and spam</strong> within a few minutes.
                            </p>
                            <p className="text-surface-400 text-xs">
                                No email? You may not have an account yet (register first), or the server mail settings
                                (SMTP) may be missing — ask the admin to check Render logs for{' '}
                                <code className="text-surface-300">forgot-password</code>.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Institute email
                                </label>
                                <div className="relative">
                                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@iiitsurat.ac.in"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {loading ? 'Sending…' : 'Send reset link'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                        >
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
