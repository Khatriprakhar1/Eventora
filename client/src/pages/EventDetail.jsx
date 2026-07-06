import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave, FaCheckCircle, FaClock, FaTimesCircle, FaArrowLeft, FaLock } from 'react-icons/fa';

const CATEGORY_COLORS = {
    Music: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    Tech: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Technology: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Workshop: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Conference: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Sports: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    default: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
};
const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;

const Spinner = () => (
    <svg className="animate-spin-slow w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
);

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [existingBooking, setExistingBooking] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: eventData } = await api.get(`/events/${id}`);
                setEvent(eventData);
                if (user) {
                    try {
                        const { data: bookings } = await api.get('/bookings/my');
                        const match = bookings.find((b) => b.eventId && b.eventId._id === id);
                        if (match) setExistingBooking(match);
                    } catch (err) { console.error('Error checking bookings:', err); }
                }
            } catch (err) {
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleBooking = async () => {
        if (!user) { navigate('/login'); return; }
        setBookingLoading(true);
        setError(''); setSuccessMsg('');
        try {
            if (!showOTP) {
                await api.post('/bookings/send-otp');
                setShowOTP(true);
                setSuccessMsg('OTP sent to your email. Please verify to confirm booking.');
            } else {
                const { data } = await api.post('/bookings', { eventId: event._id, otp });
                setSuccessMsg('Booking requested! Awaiting admin confirmation.');
                setShowOTP(false); setOtp('');
                setExistingBooking(data.booking);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto mt-8 animate-pulse">
            <div className="skeleton h-80 w-full rounded-3xl mb-8" />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <div className="skeleton h-4 w-24" /><div className="skeleton h-10 w-3/4" />
                    <div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-5/6" />
                </div>
                <div className="skeleton h-64 rounded-2xl" />
            </div>
        </div>
    );
    if (error && !event) return (
        <div className="text-center py-24 animate-fade-in">
            <p className="text-red-500 text-xl font-bold">{error}</p>
            <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">← Back to Events</Link>
        </div>
    );

    const isSoldOut = event.availableSeats <= 0;
    const hasActiveBooking = existingBooking && existingBooking.status !== 'cancelled';
    const seatPct = (event.availableSeats / event.totalSeats) * 100;
    const seatBarColor = seatPct > 50 ? 'bg-emerald-500' : seatPct > 20 ? 'bg-amber-500' : 'bg-red-500';

    const getStatusBadge = () => {
        if (!existingBooking) return null;
        const { status } = existingBooking;
        if (status === 'confirmed') return (
            <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center">
                <FaCheckCircle className="text-emerald-500 text-4xl mx-auto mb-3" />
                <p className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">Booking Confirmed!</p>
                <p className="text-emerald-600 dark:text-emerald-500 text-sm mt-1 mb-3">Your spot for this event is secured.</p>
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 px-4 py-2 rounded-xl transition">View in Dashboard →</Link>
            </div>
        );
        if (status === 'pending') return (
            <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-center">
                <FaClock className="text-amber-500 text-4xl mx-auto mb-3" />
                <p className="text-amber-700 dark:text-amber-400 font-bold text-lg">Booking Pending</p>
                <p className="text-amber-600 dark:text-amber-500 text-sm mt-1 mb-3">Awaiting admin confirmation.</p>
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 px-4 py-2 rounded-xl transition">View in Dashboard →</Link>
            </div>
        );
        if (status === 'cancelled') return (
            <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center mb-4">
                <FaTimesCircle className="text-red-400 text-3xl mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400 font-bold">Previous booking was cancelled</p>
                <p className="text-red-500 dark:text-red-500 text-sm mt-1">You can book again below.</p>
            </div>
        );
        return null;
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 text-sm font-medium mb-6 transition group">
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Events
            </Link>

            {/* Hero Image */}
            <div className="relative w-full h-72 md:h-96 rounded-3xl overflow-hidden mb-8 shadow-xl">
                {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black uppercase tracking-widest text-white/50" style={{ background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)' }}>
                        {event.category}
                    </div>
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                <div className="absolute bottom-6 left-6 right-6">
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 ${getCategoryColor(event.category)}`}>{event.category}</span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-lg">{event.title}</h1>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:items-start">
                {/* Description */}
                <div className="md:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About this Event</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{event.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: <FaCalendarAlt className="text-brand-500" />, label: 'Date', value: new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                            { icon: <FaMapMarkerAlt className="text-brand-500" />, label: 'Location', value: event.location },
                            { icon: <FaMoneyBillWave className="text-brand-500" />, label: 'Ticket Price', value: event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}` },
                            { icon: <FaChair className="text-brand-500" />, label: 'Availability', value: `${event.availableSeats} / ${event.totalSeats} seats` },
                        ].map(({ icon, label, value }) => (
                            <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0 text-lg">{icon}</div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Booking Card */}
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-24">
                        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-brand-700" />
                        <div className="p-6">
                            <div className="flex items-baseline justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Reserve a Spot</h3>
                                <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                                    {event.ticketPrice === 0 ? <span className="text-emerald-600 dark:text-emerald-400">Free</span> : `₹${event.ticketPrice}`}
                                </span>
                            </div>
                            <div className="mb-5">
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-1.5">
                                    <div className={`${seatBarColor} h-1.5 rounded-full`} style={{ width: `${seatPct}%` }} />
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    <span className={seatPct < 20 ? 'text-red-500 font-bold' : ''}>{event.availableSeats}</span> of {event.totalSeats} seats remaining
                                </p>
                            </div>

                            {hasActiveBooking ? getStatusBadge() : (
                                <>
                                    {existingBooking?.status === 'cancelled' && getStatusBadge()}
                                    {showOTP && (
                                        <div className="mb-4">
                                            <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-xl mb-3 font-medium">
                                                ✅ OTP sent! Check your email.
                                            </div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
                                                <FaLock className="inline mr-1 text-brand-400" /> Enter OTP to Confirm
                                            </label>
                                            <input
                                                type="text" required placeholder="000000"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-brand-200 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/30 focus:ring-2 focus:ring-brand-400 focus:border-brand-500 focus:outline-none transition font-black tracking-[0.6em] text-center text-xl text-brand-800 dark:text-brand-300"
                                                value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6"
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={handleBooking}
                                        disabled={isSoldOut || bookingLoading || (showOTP && !otp)}
                                        className={`w-full py-3.5 px-6 rounded-xl font-bold text-base transition shadow-md flex items-center justify-center gap-2 ${
                                            isSoldOut ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-200 dark:shadow-brand-900/50 hover:-translate-y-0.5'
                                        }`}
                                    >
                                        {bookingLoading ? <><Spinner /> Processing...</>
                                            : showOTP ? 'Verify OTP & Confirm'
                                            : isSoldOut ? 'Sold Out'
                                            : 'Confirm Registration'}
                                    </button>
                                    {!user && !isSoldOut && (
                                        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
                                            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign in</Link> to book this event
                                        </p>
                                    )}
                                </>
                            )}

                            {error && <div className="mt-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium px-3 py-2 rounded-xl text-center">{error}</div>}
                            {successMsg && <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium px-3 py-2 rounded-xl text-center">{successMsg}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
