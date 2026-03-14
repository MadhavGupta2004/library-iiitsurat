import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineSun, HiOutlineMoon, HiOutlineLogout, HiOutlineBookOpen, HiOutlineCurrencyRupee } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [fine, setFine] = useState(0);

    useEffect(() => {
        if (user && user.role === 'student') {
            const fetchFine = async () => {
                try {
                    const res = await api.get('/transactions/stats');
                    setFine(res.data.totalFine || 0);
                } catch (err) {
                    console.error('Failed to fetch fine for navbar:', err);
                }
            };
            fetchFine();
        }
    }, [user, location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300">
                            <HiOutlineBookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-surface-900 dark:text-white leading-none">
                                IIIT Surat
                            </h1>
                            <p className="text-xs text-surface-500 dark:text-surface-400 leading-none mt-0.5">
                                Library Portal
                            </p>
                        </div>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all duration-200 group"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? (
                                <HiOutlineSun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                            ) : (
                                <HiOutlineMoon className="w-5 h-5 text-surface-600 group-hover:-rotate-12 transition-transform duration-300" />
                            )}
                        </button>

                        {user && user.role === 'student' && fine > 0 && (
                            <Link
                                to="/student/pay-fine"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-all duration-200"
                            >
                                <HiOutlineCurrencyRupee className="w-4 h-4" />
                                <span className="text-xs font-bold leading-none">₹{fine}</span>
                            </Link>
                        )}

                        {user && (
                            <div className="flex items-center gap-3">
                                {/* User info */}
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                                        {user.name}
                                    </span>
                                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium capitalize">
                                        {user.role}
                                    </span>
                                </div>

                                {/* Avatar */}
                                <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-accent-400 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 group"
                                    aria-label="Logout"
                                >
                                    <HiOutlineLogout className="w-5 h-5 text-red-500 group-hover:translate-x-0.5 transition-transform duration-200" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
