import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import BookSearch from './pages/student/BookSearch';
import IssueHistory from './pages/student/IssueHistory';
import PaymentPage from './pages/student/PaymentPage';
import PaymentHistory from './pages/student/PaymentHistory';

// Librarian pages
import LibrarianDashboard from './pages/librarian/Dashboard';
import AddBook from './pages/librarian/AddBook';
import EditBook from './pages/librarian/EditBook';
import ManageBooks from './pages/librarian/ManageBooks';
import QRScanner from './pages/librarian/QRScanner';
import OverdueBooks from './pages/librarian/OverdueBooks';
import FineCollection from './pages/librarian/FineCollection';
import ExportData from './pages/librarian/ExportData';
import AdminPayments from './pages/librarian/AdminPayments';
import Students from './pages/librarian/Students';
import IssueBook from './pages/librarian/IssueBook';

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-surface-500 dark:text-surface-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/login"
                element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login />}
            />
            <Route
                path="/register"
                element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Register />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student routes */}
            <Route
                path="/student/dashboard"
                element={
                    <ProtectedRoute role="student">
                        <StudentDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/books"
                element={
                    <ProtectedRoute role="student">
                        <BookSearch />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/history"
                element={
                    <ProtectedRoute role="student">
                        <IssueHistory />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/pay-fine"
                element={
                    <ProtectedRoute role="student">
                        <PaymentPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/payments"
                element={
                    <ProtectedRoute role="student">
                        <PaymentHistory />
                    </ProtectedRoute>
                }
            />

            {/* Librarian routes */}
            <Route
                path="/librarian/dashboard"
                element={
                    <ProtectedRoute role="librarian">
                        <LibrarianDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/books"
                element={
                    <ProtectedRoute role="librarian">
                        <ManageBooks />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/add-book"
                element={
                    <ProtectedRoute role="librarian">
                        <AddBook />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/edit-book/:id"
                element={
                    <ProtectedRoute role="librarian">
                        <EditBook />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/issue-book"
                element={
                    <ProtectedRoute role="librarian">
                        <IssueBook />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/scanner"
                element={
                    <ProtectedRoute role="librarian">
                        <QRScanner />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/overdue"
                element={
                    <ProtectedRoute role="librarian">
                        <OverdueBooks />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/fines"
                element={
                    <ProtectedRoute role="librarian">
                        <FineCollection />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/export"
                element={
                    <ProtectedRoute role="librarian">
                        <ExportData />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/payments"
                element={
                    <ProtectedRoute role="librarian">
                        <AdminPayments />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/librarian/students"
                element={
                    <ProtectedRoute role="librarian">
                        <Students />
                    </ProtectedRoute>
                }
            />

            {/* Default redirect */}
            <Route
                path="*"
                element={
                    user ? (
                        <Navigate to={`/${user.role}/dashboard`} replace />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '14px',
                    },
                }}
            />
            <AppRoutes />
        </Router>
    );
}

export default App;
