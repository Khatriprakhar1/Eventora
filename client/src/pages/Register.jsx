import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaTicketAlt, FaEye, FaEyeSlash, FaShieldAlt, FaCalendarAlt, FaUsers } from 'react-icons/fa';

const Spinner = () => (
    <svg className="animate-spin-slow w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
);

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                await register(name, email, password);
                setShowOTP(true);
            } else {
                await verifyOTP(email, otp);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(typeof err === 'string' ? err : (err?.message || 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center -mt-4 py-6 animate-fade-in">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 dark:border-gray-700">

                {/* Left Panel */}
                <div className="hidden md:flex md:w-5/12 flex-col justify-between p-10 text-white relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)', transform: 'translate(-30%, 30%)' }} />
                    <div className="relative z-10">
                        <Link to="/" className="flex items-center gap-2.5 mb-12">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <FaTicketAlt className="text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight">Eventora</span>
                        </Link>
                        <h2 className="text-3xl font-black mb-4 leading-tight">Join thousands of event-goers!</h2>
                        <p className="text-brand-200 text-sm leading-relaxed mb-10">
                            Create your free account and start discovering amazing events near you.
                        </p>
                        <div className="space-y-4">
                            {[
                                { icon: <FaShieldAlt />, text: 'Secured with 2FA OTP verification' },
                                { icon: <FaCalendarAlt />, text: 'Access curated events near you' },
                                { icon: <FaUsers />, text: 'Join 10,000+ event attendees' },
                            ].map(({ icon, text }) => (
                                <div key={text} className="flex items-center gap-3 text-brand-200 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white">{icon}</div>
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="relative z-10 text-brand-300 text-xs mt-8">&copy; {new Date().getFullYear()} Eventora Platform</p>
                </div>

                {/* Right Panel — Form */}
                <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                            {showOTP ? 'Verify Your Email' : 'Create Account'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {showOTP ? 'We sent a 6-digit code to your email. Enter it below.'
                                : <>Already have an account?{' '}<Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link></>}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-start gap-2">
                            <span className="mt-0.5">⚠</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!showOTP ? (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                    <input type="text" required placeholder="John Doe"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm placeholder-gray-400 dark:placeholder-gray-500"
                                        value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                                    <input type="email" required placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm placeholder-gray-400 dark:placeholder-gray-500"
                                        value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} required
                                            minLength={8} maxLength={128}
                                            placeholder="Min. 8 characters"
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm placeholder-gray-400 dark:placeholder-gray-500"
                                            value={password} onChange={(e) => setPassword(e.target.value)} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1">
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl mb-5 text-sm font-medium">
                                    ✅ OTP sent successfully! Check your email inbox.
                                </div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">Enter Verification Code</label>
                                <input type="text" required placeholder="000000"
                                    className="w-full px-4 py-4 rounded-xl border-2 border-brand-200 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30 focus:ring-2 focus:ring-brand-400 focus:border-brand-500 focus:outline-none transition font-black tracking-[0.8em] text-center text-2xl text-brand-800 dark:text-brand-300"
                                    value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" />
                            </div>
                        )}
                        <button type="submit" disabled={loading}
                            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-brand-200 dark:shadow-brand-900/50 hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2">
                            {loading ? <><Spinner /> Processing...</> : (showOTP ? 'Verify & Complete' : 'Create Account')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
