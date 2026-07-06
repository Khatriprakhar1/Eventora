import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import About from './pages/About';
import Contact from './pages/Contact';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import MyTickets from './pages/MyTickets';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';
import { FaTicketAlt, FaBan } from 'react-icons/fa';

// Blocks admin from accessing regular user pages — redirects to /admin
const BlockAdmin = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return children;
};

// Requires admin role — redirects others to /login
const RequireAdmin = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return children;
};


const NotFound = () => (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="w-28 h-28 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-8 shadow-inner">
            <FaTicketAlt className="text-brand-400 text-5xl" />
        </div>
        <h1 className="text-8xl font-black text-brand-600 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-md">
            Looks like this event has left the building. The page you're looking for doesn't exist.
        </p>
        <Link
            to="/"
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-10 rounded-xl transition shadow-lg hover:-translate-y-0.5"
        >
            Back to Events
        </Link>
    </div>
);

// Full-screen overlay shown when a suspended user hits any protected route
const SuspendedOverlay = () => {
    const { logout } = useContext(AuthContext);
    const { dark } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`relative w-full max-w-sm rounded-3xl shadow-2xl animate-fade-in overflow-hidden ${
                dark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
            }`}>
                {/* Thin red top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-500" />

                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5">
                        <FaBan className="text-red-500 text-2xl" />
                    </div>

                    {/* Text */}
                    <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                        Your account has been suspended
                    </h2>
                    <p className={`text-sm leading-relaxed mb-7 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                        An admin has restricted access to your account.
                        If you think this is a mistake, please reach out to support.
                    </p>

                    {/* Divider */}
                    <div className={`border-t mb-6 ${dark ? 'border-white/8' : 'border-gray-100'}`} />

                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition hover:-translate-y-0.5 shadow-md shadow-red-500/20"
                    >
                        Log out of my account
                    </button>
                </div>
            </div>
        </div>
    );
};

const AppInner = () => {
    const { dark } = useTheme();
    const { isSuspended } = useContext(AuthContext);

    return (
        <div
            className="min-h-screen flex flex-col transition-colors duration-300"
            style={{
                background: dark
                    ? 'linear-gradient(135deg, #0a0a0f 0%, #0f0c29 50%, #0a0a0f 100%)'
                    : 'linear-gradient(135deg, #f5f5f7 0%, #eef2ff 50%, #f5f5f7 100%)',
            }}
        >
            {/* Suspended overlay — sits above everything */}
            {isSuspended && <SuspendedOverlay />}

            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    <Route path="/"                element={<BlockAdmin><Home /></BlockAdmin>} />
                    <Route path="/events/:id"      element={<BlockAdmin><EventDetail /></BlockAdmin>} />
                    <Route path="/login"           element={<Login />} />
                    <Route path="/register"        element={<Register />} />
                    <Route path="/dashboard"       element={<BlockAdmin><UserDashboard /></BlockAdmin>} />
                    <Route path="/admin"           element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/payment-success" element={<BlockAdmin><PaymentSuccess /></BlockAdmin>} />
                    <Route path="/payment-failed"  element={<BlockAdmin><PaymentFailed /></BlockAdmin>} />
                    <Route path="/about"           element={<BlockAdmin><About /></BlockAdmin>} />
                    <Route path="/contact"         element={<BlockAdmin><Contact /></BlockAdmin>} />
                    <Route path="/categories"      element={<BlockAdmin><Categories /></BlockAdmin>} />
                    <Route path="/profile"         element={<Profile />} />
                    <Route path="/tickets"         element={<BlockAdmin><MyTickets /></BlockAdmin>} />
                    <Route path="*"                element={<NotFound />} />
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <Router>
                <AppInner />
            </Router>
        </ThemeProvider>
    );
}

export default App;
