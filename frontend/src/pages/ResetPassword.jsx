import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
    HiOutlineBookOpen,
    HiOutlineLockClosed,
    HiOutlineSun,
    HiOutlineMoon,
} from 'react-icons/hi';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            toast.error('Invalid reset link');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.error('Missing reset token. Open the link from your email.');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (password !== confirm) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', {
                token,
                password,
            });
            toast.success(data.message || 'Password reset');
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed');
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
                    <h1 className="text-3xl font-bold text-white mb-1">Set new password</h1>
                    <p className="text-surface-400 text-sm">Choose a new password for your account.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {!token ? (
                        <p className="text-surface-300 text-sm">
                            This link is invalid. Request a new reset from the sign-in page.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    New password
                                </label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                        required
                                        minLength={6}
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                    <input
                                        type="password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="Confirm new password"
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
                                {loading ? 'Saving…' : 'Update password'}
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

export default ResetPassword;
