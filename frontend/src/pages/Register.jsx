import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { HiOutlineBookOpen, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.endsWith('@iiitsurat.ac.in')) {
            toast.error('Only @iiitsurat.ac.in emails are allowed');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const data = await register(
                formData.name,
                formData.email,
                formData.password,
                formData.role
            );
            toast.success('Account created successfully!');
            navigate(`/${data.role}/dashboard`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-surface-900 to-accent-950 relative overflow-hidden py-10">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse-soft"></div>
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-soft"></div>
            </div>

            {/* Dark mode toggle */}
            <button
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
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-lg">
                        <HiOutlineBookOpen className="w-9 h-9 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
                    <p className="text-surface-400">Join IIIT Surat Library Portal</p>
                </div>

                {/* Form */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-2">Full Name</label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-2">Institute Email</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@iiitsurat.ac.in"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-2">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 6 characters"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-2">Confirm Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter password"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-2">Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'student' })}
                                    className={`py-3 rounded-xl font-medium text-sm transition-all duration-200 ${formData.role === 'student'
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                            : 'bg-white/5 text-surface-300 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    🎓 Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'librarian' })}
                                    className={`py-3 rounded-xl font-medium text-sm transition-all duration-200 ${formData.role === 'librarian'
                                            ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/25'
                                            : 'bg-white/5 text-surface-300 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    📚 Librarian
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98] disabled:opacity-50 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-surface-400 text-sm">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
