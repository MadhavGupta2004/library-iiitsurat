import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineHome,
    HiOutlineSearch,
    HiOutlineClipboardList,
    HiOutlinePlusCircle,
    HiOutlineCollection,
    HiOutlineQrcode,
    HiOutlineExclamationCircle,
    HiOutlineCurrencyRupee,
    HiOutlineDocumentDownload,
    HiOutlineUserGroup,
    HiOutlineBookOpen,
} from 'react-icons/hi';

const studentLinks = [
    { to: '/student/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/student/books', icon: HiOutlineSearch, label: 'Search Books' },
    { to: '/student/history', icon: HiOutlineClipboardList, label: 'Issue History' },
    { to: '/student/pay-fine', icon: HiOutlineCurrencyRupee, label: 'Pay Fine' },
    { to: '/student/payments', icon: HiOutlineClipboardList, label: 'Payment History' },
];

const librarianLinks = [
    { to: '/librarian/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/librarian/issue-book', icon: HiOutlineBookOpen, label: 'Issue Book' },
    { to: '/librarian/students', icon: HiOutlineUserGroup, label: 'Students' },
    { to: '/librarian/books', icon: HiOutlineCollection, label: 'Manage Books' },
    { to: '/librarian/add-book', icon: HiOutlinePlusCircle, label: 'Add Book' },
    { to: '/librarian/scanner', icon: HiOutlineQrcode, label: 'QR Scanner' },
    { to: '/librarian/overdue', icon: HiOutlineExclamationCircle, label: 'Overdue Books' },
    { to: '/librarian/fines', icon: HiOutlineCurrencyRupee, label: 'Fine Collection' },
    { to: '/librarian/payments', icon: HiOutlineCurrencyRupee, label: 'Payments' },
    { to: '/librarian/export', icon: HiOutlineDocumentDownload, label: 'Export Data' },
];

const Sidebar = () => {
    const { user } = useAuth();
    const links = user?.role === 'librarian' ? librarianLinks : studentLinks;

    return (
        <aside className="w-64 shrink-0 hidden lg:block">
            <div className="sticky top-20 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4 shadow-sm">
                <div className="mb-4 px-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                        Navigation
                    </p>
                </div>
                <nav className="space-y-1">
                    {links.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm'
                                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50 hover:text-surface-900 dark:hover:text-surface-200'
                                }`
                            }
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110`} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
