import { useState } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { HiOutlineDocumentDownload, HiOutlineDownload } from 'react-icons/hi';

const ExportData = () => {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/transactions/export', {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('CSV exported successfully!');
        } catch (err) {
            toast.error('Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-xl space-y-6">
                <h1 className="page-title">Export Data</h1>

                <div className="card p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <HiOutlineDocumentDownload className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>

                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                        Export Transaction Data
                    </h2>
                    <p className="text-surface-500 dark:text-surface-400 mb-6 text-sm">
                        Download all transaction records as a CSV file, including student details, book info, issue/return dates, fines, and status.
                    </p>

                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <HiOutlineDownload className="w-5 h-5" />
                                Download CSV
                            </>
                        )}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ExportData;
