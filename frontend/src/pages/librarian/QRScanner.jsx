import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { HiOutlineQrcode, HiOutlineSearch } from 'react-icons/hi';

const QRScanner = () => {
    const [mode, setMode] = useState('issue'); // issue or return
    const [scanResult, setScanResult] = useState(null);
    const [userId, setUserId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);

    const startScanner = async () => {
        try {
            const { Html5Qrcode } = await import('html5-qrcode');

            if (html5QrcodeRef.current) {
                await html5QrcodeRef.current.stop();
            }

            const html5QrCode = new Html5Qrcode('qr-reader');
            html5QrcodeRef.current = html5QrCode;
            setScanning(true);

            await html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    try {
                        const data = JSON.parse(decodedText);
                        setScanResult(data);
                        html5QrCode.stop();
                        setScanning(false);
                    } catch (e) {
                        toast.error('Invalid QR code format');
                    }
                },
                () => { } // Ignore scan failures
            );
        } catch (err) {
            toast.error('Camera access denied or not available. Use manual input instead.');
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.stop();
            } catch (e) {
                // ignore
            }
            setScanning(false);
        }
    };

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const handleManualInput = () => {
        try {
            const data = JSON.parse(manualInput);
            if (data.bookId && data.copyNumber) {
                setScanResult(data);
                setManualInput('');
            } else {
                toast.error('Invalid QR data format. Need bookId and copyNumber.');
            }
        } catch (e) {
            toast.error('Invalid JSON format');
        }
    };

    const searchStudents = async () => {
        if (!studentSearch.trim()) {
            setStudentResults([]);
            return;
        }
        try {
            const res = await api.get('/students', { params: { search: studentSearch.trim() } });
            setStudentResults(res.data || []);
        } catch (err) {
            setStudentResults([]);
        }
    };

    const handleIssue = async () => {
        const idToUse = selectedStudent?._id || userId?.trim();
        if (!idToUse) {
            toast.error('Please search and select a student, or enter the student User ID');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/transactions/issue', {
                bookId: scanResult.bookId,
                copyNumber: scanResult.copyNumber,
                userId: idToUse,
            });
            toast.success(`Book issued to ${res.data.user?.name || 'student'}!`);
            setScanResult(null);
            setUserId('');
            setSelectedStudent(null);
            setStudentSearch('');
            setStudentResults([]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to issue book');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async () => {
        setLoading(true);
        try {
            const res = await api.post('/transactions/return', {
                bookId: scanResult.bookId,
                copyNumber: scanResult.copyNumber,
            });
            const fine = res.data.fine;
            if (fine > 0) {
                toast.success(`Book returned. Fine: ₹${fine}`);
            } else {
                toast.success('Book returned successfully!');
            }
            setScanResult(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to return book');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl space-y-6">
                <h1 className="page-title">QR Scanner</h1>

                {/* Mode Toggle */}
                <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
                    <button
                        onClick={() => {
                            setMode('issue');
                            setScanResult(null);
                            setSelectedStudent(null);
                            setStudentSearch('');
                            setStudentResults([]);
                            setUserId('');
                        }}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'issue'
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200'
                            }`}
                    >
                        📤 Issue Book
                    </button>
                    <button
                        onClick={() => {
                            setMode('return');
                            setScanResult(null);
                            setSelectedStudent(null);
                            setStudentSearch('');
                            setStudentResults([]);
                        }}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'return'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200'
                            }`}
                    >
                        📥 Return Book
                    </button>
                </div>

                {!scanResult ? (
                    <div className="space-y-4">
                        {/* Scanner Area */}
                        <div className="card p-6">
                            <div
                                id="qr-reader"
                                ref={scannerRef}
                                className="w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-surface-900"
                                style={{ minHeight: scanning ? '300px' : '0px' }}
                            ></div>

                            <div className="flex justify-center mt-4">
                                {!scanning ? (
                                    <button onClick={startScanner} className="btn-primary flex items-center gap-2">
                                        <HiOutlineQrcode className="w-5 h-5" />
                                        Start Scanner
                                    </button>
                                ) : (
                                    <button onClick={stopScanner} className="btn-danger flex items-center gap-2">
                                        Stop Scanner
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Manual Input */}
                        <div className="card p-6">
                            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
                                Or enter QR data manually
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder='{"bookId":"...","copyNumber":1}'
                                    className="input-field flex-1 text-sm"
                                />
                                <button onClick={handleManualInput} className="btn-secondary">
                                    <HiOutlineSearch className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Scanned Result */
                    <div className="card p-6 animate-slide-up">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
                            📖 Scanned Book Details
                        </h3>
                        <div className="bg-surface-50 dark:bg-surface-900/50 rounded-xl p-4 space-y-2 mb-4">
                            <p className="text-sm">
                                <span className="font-medium text-surface-500">Book:</span>{' '}
                                <span className="text-surface-900 dark:text-white">{scanResult.title || scanResult.bookId}</span>
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-surface-500">ISBN:</span>{' '}
                                <span className="text-surface-900 dark:text-white">{scanResult.isbn || 'N/A'}</span>
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-surface-500">Copy #:</span>{' '}
                                <span className="text-surface-900 dark:text-white">{scanResult.copyNumber}</span>
                            </p>
                        </div>

                        {mode === 'issue' && (
                            <div className="mb-4 space-y-2">
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                                    Student (search by name or enrollment)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={studentSearch}
                                        onChange={(e) => {
                                            setStudentSearch(e.target.value);
                                            setSelectedStudent(null);
                                        }}
                                        onBlur={() => setTimeout(() => setStudentResults([]), 200)}
                                        onFocus={() => studentSearch.trim() && searchStudents()}
                                        placeholder="e.g. Madhav or ui23ec33"
                                        className="input-field flex-1"
                                    />
                                    <button type="button" onClick={searchStudents} className="btn-secondary shrink-0">
                                        <HiOutlineSearch className="w-5 h-5" />
                                    </button>
                                </div>
                                {selectedStudent ? (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white text-sm">{selectedStudent.name}</p>
                                            <p className="text-xs text-surface-500">{selectedStudent.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                                            className="text-xs text-surface-500 hover:text-red-600"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                ) : studentResults.length > 0 ? (
                                    <ul className="max-h-40 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 divide-y divide-surface-100 dark:divide-surface-700">
                                        {studentResults.map((s) => (
                                            <li key={s._id}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStudent(s);
                                                        setStudentSearch(s.name);
                                                        setStudentResults([]);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-50 dark:hover:bg-surface-700"
                                                >
                                                    <span className="font-medium text-surface-900 dark:text-white">{s.name}</span>
                                                    <span className="text-surface-500 ml-2">{s.email}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                <p className="text-xs text-surface-500">Or enter User ID manually:</p>
                                <input
                                    type="text"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="MongoDB User ID (optional)"
                                    className="input-field text-sm"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            {mode === 'issue' ? (
                                <button onClick={handleIssue} disabled={loading} className="btn-primary flex-1">
                                    {loading ? 'Processing...' : '📤 Issue Book'}
                                </button>
                            ) : (
                                <button onClick={handleReturn} disabled={loading} className="btn-success flex-1">
                                    {loading ? 'Processing...' : '📥 Return Book'}
                                </button>
                            )}
                            <button
                                onClick={() => setScanResult(null)}
                                className="btn-secondary"
                            >
                                Scan Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default QRScanner;
