import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';

const QRCode = ({ value }) => {
    // Visual QR placeholder — unique per booking
    const rows = 7;
    const size = rows * rows;
    // Create a deterministic pattern from value string
    const hash = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const cells = Array.from({ length: size }, (_, i) => {
        // Corner squares (finder patterns)
        const r = Math.floor(i / rows);
        const c = i % rows;
        const isCorner = (r < 2 && c < 2) || (r < 2 && c >= rows - 2) || (r >= rows - 2 && c < 2);
        if (isCorner) return true;
        return ((i * 3 + hash) % 5) < 2;
    });
    return (
        <div className="p-1 bg-white rounded-lg border border-gray-200 dark:border-gray-600 inline-flex flex-col gap-0.5">
            {Array.from({ length: rows }, (_, r) => (
                <div key={r} className="flex gap-0.5">
                    {Array.from({ length: rows }, (_, c) => (
                        <div
                            key={c}
                            className={`w-3.5 h-3.5 rounded-sm ${cells[r * rows + c] ? 'bg-gray-900 dark:bg-gray-800' : 'bg-white'}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

const STATUS_COLORS = {
    confirmed: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    pending: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    cancelled: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
};

const GRADIENT = {
    confirmed: 'from-emerald-400 to-teal-500',
    pending: 'from-amber-400 to-orange-500',
    cancelled: 'from-red-400 to-rose-500',
};

const MyTickets = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('confirmed');

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = bookings.filter(b => b.status === filter);
    const counts = {
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        pending: bookings.filter(b => b.status === 'pending').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                        <FaTicketAlt className="text-brand-600 dark:text-brand-400" />
                    </div>
                    My Tickets
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Your event booking history and confirmed tickets.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8">
                {[
                    { key: 'confirmed', label: 'Confirmed', emoji: '✅' },
                    { key: 'pending', label: 'Pending', emoji: '⏳' },
                    { key: 'cancelled', label: 'Cancelled', emoji: '❌' },
                ].map(({ key, label, emoji }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
                            filter === key
                                ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                        }`}
                    >
                        {emoji} {label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                            filter === key ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}>
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 h-48 animate-pulse skeleton" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-14 text-center shadow-sm">
                    <div className="text-5xl mb-4">🎟️</div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No {filter} tickets</h3>
                    <p className="text-gray-400 mb-6">
                        {filter === 'confirmed' ? "You don't have any confirmed bookings yet." : `No ${filter} bookings to show.`}
                    </p>
                    <Link to="/" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-7 rounded-xl transition">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filtered.map((booking, i) => {
                        if (!booking.eventId) return null;
                        const ev = booking.eventId;
                        return (
                            <div
                                key={booking._id}
                                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
                                style={{ animationDelay: `${i * 0.06}s` }}
                            >
                                {/* Top accent bar */}
                                <div className={`h-1.5 w-full bg-gradient-to-r ${GRADIENT[booking.status]}`} />

                                <div className="flex flex-col md:flex-row">
                                    {/* Ticket body */}
                                    <div className="flex-grow p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mb-2 ${STATUS_COLORS[booking.status]}`}>
                                                    <span className="relative flex h-2 w-2">
                                                        {booking.status !== 'cancelled' && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${booking.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />}
                                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${booking.status === 'confirmed' ? 'bg-emerald-500' : booking.status === 'pending' ? 'bg-amber-500' : 'bg-red-400'}`} />
                                                    </span>
                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                </span>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{ev.title}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-brand-600 dark:text-brand-400">
                                                    {booking.amount === 0 ? <span className="text-emerald-600">Free</span> : `₹${booking.amount}`}
                                                </p>
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                    booking.paymentStatus === 'paid'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {booking.paymentStatus.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <FaCalendarAlt className="text-brand-400 text-xs" />
                                                {new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-brand-400 text-xs" />
                                                {ev.location}
                                            </div>
                                            <div className="flex items-center gap-2 col-span-2">
                                                <FaMoneyBillWave className="text-brand-400 text-xs" />
                                                Booked on {new Date(booking.bookedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dashed divider */}
                                    <div className="hidden md:flex flex-col items-center justify-center mx-0 my-4">
                                        <div className="h-full w-px border-l-2 border-dashed border-gray-200 dark:border-gray-700" />
                                    </div>
                                    <div className="block md:hidden mx-6">
                                        <div className="w-full border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
                                    </div>

                                    {/* QR Side */}
                                    <div className="flex flex-col items-center justify-center p-6 gap-3 shrink-0">
                                        {booking.status === 'confirmed' ? (
                                            <>
                                                <QRCode value={booking._id} />
                                                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{booking._id.slice(-8).toUpperCase()}</p>
                                            </>
                                        ) : (
                                            <div className="w-28 h-28 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                                <span className="text-4xl opacity-40">{booking.status === 'pending' ? '⏳' : '❌'}</span>
                                            </div>
                                        )}
                                        <Link
                                            to={`/events/${ev._id}`}
                                            className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                                        >
                                            View Event →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyTickets;
