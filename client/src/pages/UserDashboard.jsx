import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle, FaCalendarAlt, FaMoneyBillWave, FaSearch } from 'react-icons/fa';

const STATUS_CONFIG = {
    confirmed: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', pulse: true },
    pending: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', pulse: true },
    cancelled: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-400', pulse: false },
};
const PAYMENT_CONFIG = {
    paid: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400' },
    not_paid: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-6 space-y-4">
            <div className="flex justify-between">
                <div className="skeleton h-5 w-2/3" />
                <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
        </div>
        <div className="skeleton h-12 w-full" />
    </div>
);

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings', error);
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchBookings();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const pendingCount = bookings.filter(b => b.status === 'pending').length;

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            {/* Profile Header — always dark gradient, looks great in both modes */}
            <div className="relative rounded-3xl overflow-hidden mb-8 p-8 md:p-10" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)' }}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-40 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #c7d2fe, transparent)', transform: 'translateY(30%)' }} />
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-20 h-20 rounded-2xl border-2 border-white/30 overflow-hidden shadow-lg shrink-0">
                        {user?.avatar
                            ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-white/20 flex items-center justify-center text-3xl font-black text-white uppercase">{user?.name?.charAt(0)}</div>
                        }
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
                            Welcome back, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-brand-200 text-sm">{user?.email}</p>
                        <div className="flex gap-6 mt-4 justify-center sm:justify-start">
                            {[['Total', bookings.length, 'text-white'], ['Confirmed', confirmedCount, 'text-emerald-300'], ['Pending', pendingCount, 'text-amber-300']].map(([label, val, color]) => (
                                <div key={label} className="text-center">
                                    <p className={`text-xl font-black ${color}`}>{val}</p>
                                    <p className="text-brand-300 text-xs">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                        <FaTicketAlt className="text-brand-600 dark:text-brand-400 text-sm" />
                    </div>
                    My Booking Requests
                </h2>
                {!loading && bookings.length > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}</span>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : bookings.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-14 text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                        <FaSearch className="text-brand-300 text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No bookings yet</h3>
                    <p className="text-gray-400 dark:text-gray-500 mb-7">Start exploring events and secure your first spot!</p>
                    <Link to="/" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg hover:-translate-y-0.5">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking, i) => {
                        const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.cancelled;
                        const pc = PAYMENT_CONFIG[booking.paymentStatus] || PAYMENT_CONFIG.not_paid;
                        return (
                            <div
                                key={booking._id}
                                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col animate-fade-in"
                                style={{ animationDelay: `${i * 0.06}s` }}
                            >
                                {/* Ticket stub accent */}
                                <div className={`h-1.5 w-full ${booking.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : booking.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />
                                <div className="p-5 flex-grow">
                                    {booking.eventId ? (
                                        <>
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{booking.eventId.title}</h3>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                                                        <span className="relative flex h-2 w-2">
                                                            {sc.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sc.dot} opacity-60`} />}
                                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${sc.dot}`} />
                                                        </span>
                                                        {booking.status}
                                                    </span>
                                                    {booking.status !== 'cancelled' && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${pc.bg} ${pc.text}`}>
                                                            {booking.paymentStatus.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <FaCalendarAlt className="text-brand-400 text-xs shrink-0" />
                                                    {new Date(booking.eventId.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaMoneyBillWave className="text-brand-400 text-xs shrink-0" />
                                                    {booking.amount === 0 ? 'Free' : `₹${booking.amount}`}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-red-400 italic text-sm">Event details unavailable</p>
                                    )}
                                </div>
                                <div className="mx-5 border-t-2 border-dashed border-gray-100 dark:border-gray-700" />
                                <div className="px-5 py-3.5 bg-gray-50/60 dark:bg-gray-700/30 flex justify-between items-center">
                                    {booking.eventId && booking.status !== 'cancelled' ? (
                                        <>
                                            <Link to={`/events/${booking.eventId._id}`} className="text-brand-600 dark:text-brand-400 font-semibold text-xs hover:underline transition">View Event →</Link>
                                            <button onClick={() => cancelBooking(booking._id)} className="text-red-400 font-semibold text-xs hover:text-red-600 transition flex items-center gap-1">
                                                <FaTimesCircle /> Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-xs text-gray-400 dark:text-gray-500 italic">Booking Cancelled</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
