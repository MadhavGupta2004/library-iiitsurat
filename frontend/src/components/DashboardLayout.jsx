import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    <Sidebar />
                    <main className="flex-1 min-w-0 animate-fade-in">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
