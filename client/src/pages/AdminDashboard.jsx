import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import {
    FaCalendarAlt, FaMapMarkerAlt, FaChair, FaTicketAlt,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf,
    FaTrashAlt, FaPlus, FaTimes, FaCrown, FaMoneyBillWave,
    FaUsers, FaTag, FaImage, FaAlignLeft, FaSearch, FaChevronDown,
    FaUserShield, FaBan,
} from 'react-icons/fa';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDT = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const statusCfg = {
    confirmed: { label: 'Confirmed', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    pending: { label: 'Pending', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
};

// Returns border + gradient based on BOTH status and paymentStatus
const getCardStyle = (status, paymentStatus) => {
    if (status === 'confirmed' && paymentStatus === 'paid') return {
        border:   'border-l-green-500 dark:border-l-green-400',
        gradient: 'from-green-500 to-emerald-500',
        shadow:   'hover:shadow-green-100 dark:hover:shadow-green-900/30',
        ping:     'bg-green-500',
    };
    if (status === 'confirmed' && paymentStatus !== 'paid') return {
        border:   'border-l-blue-400 dark:border-l-blue-500',
        gradient: 'from-blue-400 to-indigo-500',
        shadow:   'hover:shadow-blue-100 dark:hover:shadow-blue-900/30',
        ping:     'bg-blue-400',
    };
    if (status === 'pending') return {
        border:   'border-l-amber-400 dark:border-l-amber-500',
        gradient: 'from-amber-400 to-orange-500',
        shadow:   'hover:shadow-amber-100 dark:hover:shadow-amber-900/30',
        ping:     'bg-amber-500',
    };
    // cancelled / default
    return {
        border:   'border-l-red-400 dark:border-l-red-500',
        gradient: 'from-red-400 to-rose-500',
        shadow:   '',
        ping:     'bg-red-400',
    };
};

const payBadge = {
    paid:     'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    not_paid: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

const StatCard = ({ label, value, icon, gradient, sub, onClick, hint }) => (
    <button
        onClick={onClick}
        className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg text-left w-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${gradient} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 bg-white" />
        <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</span>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">{icon}</div>
            </div>
            <p className="text-4xl font-black mb-1">{value}</p>
            <div className="flex items-center justify-between mt-1">
                {sub && <p className="text-xs opacity-70 font-medium">{sub}</p>}
                {hint && <span className="text-[10px] font-bold opacity-60 tracking-wide">{hint} →</span>}
            </div>
        </div>
    </button>
);

const TabBtn = ({ active, onClick, children, count, dark }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${active
                ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                : dark
                    ? 'text-gray-400 hover:text-white hover:bg-white/8'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
    >
        {children}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white/25 text-white' : dark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
            {count}
        </span>
    </button>
);

const inputCls = (dark) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ${dark
        ? 'bg-gray-900/60 border-gray-700 text-gray-100 placeholder-gray-500'
        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
    }`;

const Field = ({ label, dark, children }) => (
    <div>
        <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</label>
        {children}
    </div>
);

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const { dark } = useTheme();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('bookings');
    const [showForm, setShowForm] = useState(false);
    const [bookingSearch, setBookingSearch] = useState('');
    const [bookingFilter, setBookingFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [userSearch, setUserSearch] = useState('');
    const [confirmState, setConfirmState] = useState(null); // { userId, action, label, fn }
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', location: '',
        category: '', totalSeats: '', ticketPrice: '', image: '',
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/login'); return; }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [eventsRes, bookingsRes, usersRes] = await Promise.all([
                api.get('/events'),
                api.get('/bookings/my'),
                api.get('/users'),
            ]);
            setEvents(eventsRes.data);
            setBookings(bookingsRes.data);
            setUsers(usersRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Lightweight refresh — only re-fetches the users list (used after role/status actions)
    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) { console.error(e); }
    };

    const handleUpdateUserRole = (u) => {
        const action = u.role === 'admin' ? 'Remove Admin' : 'Make Admin';
        setConfirmState({
            userId: u._id,
            label: `${action} for "${u.name}"?`,
            fn: async () => {
                try {
                    await api.put(`/users/${u._id}/role`);
                    fetchUsers();
                } catch (err) { alert(err.response?.data?.message || 'Error updating role'); }
            },
        });
    };

    const handleToggleUserStatus = (u) => {
        const action = u.isSuspended ? 'Unsuspend' : 'Suspend';
        setConfirmState({
            userId: u._id,
            label: `${action} account for "${u.name}"?`,
            fn: async () => {
                try {
                    await api.put(`/users/${u._id}/status`);
                    fetchUsers();
                } catch (err) { alert(err.response?.data?.message || 'Error updating status'); }
            },
        });
    };

    const handleDeleteUser = (u) => {
        setConfirmState({
            userId: u._id,
            label: `Permanently delete "${u.name}" and all their bookings?`,
            danger: true,
            fn: async () => {
                try {
                    await api.delete(`/users/${u._id}`);
                    fetchUsers();
                } catch (err) { alert(err.response?.data?.message || 'Error deleting user'); }
            },
        });
    };


    const executeConfirm = async () => {
        if (!confirmState) return;
        const fn = confirmState.fn;
        setConfirmState(null);
        await fn();
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', formData);
            setShowForm(false);
            setFormData({ title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error creating event'); }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Delete this event permanently?')) return;
        try { await api.delete(`/events/${id}`); fetchData(); }
        catch { alert('Error deleting event'); }
    };

    const handleConfirm = async (id, paymentStatus) => {
        try { await api.put(`/bookings/${id}/confirm`, { paymentStatus }); fetchData(); }
        catch (err) { alert(err.response?.data?.message || 'Error confirming booking'); }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Cancel this booking?")) return;
        try { await api.delete(`/bookings/${id}`); fetchData(); }
        catch (err) { alert(err.response?.data?.message || 'Error cancelling booking'); }
    };

    const revenue = bookings.reduce((s, b) => b.paymentStatus === 'paid' && b.status === 'confirmed' ? s + b.amount : s, 0);
    const paidClients = new Set(bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').map(b => b.userId?._id)).size;
    const pendingCount = bookings.filter(b => b.status === 'pending').length;

    const filteredBookings = bookings.filter(b => {
        const q = bookingSearch.toLowerCase();
        const matchesSearch = !q
            || b.userId?.name?.toLowerCase().includes(q)
            || b.userId?.email?.toLowerCase().includes(q)
            || b.eventId?.title?.toLowerCase().includes(q);
        const matchesFilter = bookingFilter === 'all' || b.status === bookingFilter;
        return matchesSearch && matchesFilter;
    });

    const upd = (k) => (e) => setFormData(f => ({ ...f, [k]: e.target.value }));

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center animate-pulse">
                <FaCrown className="text-white text-2xl" />
            </div>
            <p className={`font-semibold text-lg ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Loading Admin Panel…</p>
        </div>
    );

    return (
        <>
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

            {/* Hero Header */}
            <div
                className="relative overflow-hidden rounded-3xl p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}
            >
                <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)', transform: 'translate(-30%,-40%)' }} />
                <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(30%,40%)' }} />

                <div className="relative z-10 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                            <FaCrown className="text-amber-300 text-lg" />
                        </div>
                        <span className="text-indigo-200 text-sm font-semibold uppercase tracking-widest">Admin Panel</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Control Center</h1>
                    <p className="text-indigo-300 text-sm">Manage events, review bookings &amp; track revenue.</p>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="relative z-10 flex items-center gap-2.5 bg-white text-indigo-700 font-black px-6 py-3.5 rounded-xl hover:bg-indigo-50 transition shadow-xl hover:-translate-y-0.5 shrink-0 text-sm"
                >
                    <FaPlus /> Create New Event
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard
                    label="Total Revenue"
                    value={`₹${revenue.toLocaleString('en-IN')}`}
                    icon={<FaMoneyBillWave />}
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    sub="From confirmed paid bookings"
                    hint="View confirmed"
                    onClick={() => { setTab('bookings'); setBookingFilter('confirmed'); setBookingSearch(''); }}
                />
                <StatCard
                    label="Paid Clients"
                    value={paidClients}
                    icon={<FaUsers />}
                    gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    sub="Unique paying customers"
                    hint="View confirmed"
                    onClick={() => { setTab('bookings'); setBookingFilter('confirmed'); setBookingSearch(''); }}
                />
                <StatCard
                    label="Pending Requests"
                    value={pendingCount}
                    icon={<FaHourglassHalf />}
                    gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                    sub="Awaiting your review"
                    hint="View pending"
                    onClick={() => { setTab('bookings'); setBookingFilter('pending'); setBookingSearch(''); }}
                />
            </div>

            {/* Tabs */}
            <div className={`flex items-center gap-2 p-1.5 rounded-2xl w-fit ${dark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'}`}>
                <TabBtn active={tab === 'bookings'} onClick={() => setTab('bookings')} count={bookings.length} dark={dark}>
                    <FaTicketAlt className="text-xs" /> Booking Requests
                </TabBtn>
                <TabBtn active={tab === 'events'} onClick={() => setTab('events')} count={events.length} dark={dark}>
                    <FaCalendarAlt className="text-xs" /> All Events
                </TabBtn>
                <TabBtn active={tab === 'users'} onClick={() => setTab('users')} count={users.length} dark={dark}>
                    <FaUsers className="text-xs" /> Users
                </TabBtn>
            </div>

            {/* Bookings Tab */}
            {tab === 'bookings' && (
                <div className="space-y-5">
                    {/* Search + Filter bar */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search input */}
                        <div className="relative flex-1">
                            <FaSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                placeholder="Search by user, email or event…"
                                value={bookingSearch}
                                onChange={e => setBookingSearch(e.target.value)}
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ${dark
                                        ? 'bg-gray-800/60 border-white/10 text-gray-100 placeholder-gray-500'
                                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                                    }`}
                            />
                            {bookingSearch && (
                                <button
                                    onClick={() => setBookingSearch('')}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                        {/* Status filter pills */}
                        <div className={`flex items-center gap-1.5 p-1 rounded-xl shrink-0 ${dark ? 'bg-white/5 border border-white/8' : 'bg-gray-100 border border-gray-200'}`}>
                            {[['all', 'All'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['cancelled', 'Cancelled']].map(([val, lbl]) => (
                                <button
                                    key={val}
                                    onClick={() => setBookingFilter(val)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${bookingFilter === val
                                            ? val === 'pending' ? 'bg-amber-500 text-white shadow'
                                                : val === 'confirmed' ? 'bg-emerald-500 text-white shadow'
                                                    : val === 'cancelled' ? 'bg-red-500 text-white shadow'
                                                        : 'bg-brand-600 text-white shadow'
                                            : dark ? 'text-gray-400 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                                        }`}
                                >
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results count */}
                    <p className={`text-xs font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Showing <span className={`font-bold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{filteredBookings.length}</span> of {bookings.length} bookings
                    </p>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredBookings.length === 0 ? (
                            <div className={`col-span-2 rounded-2xl border p-16 text-center ${dark ? 'border-white/10' : 'border-gray-200 bg-gray-50'}`}>
                                <FaSearch className={`mx-auto text-4xl mb-3 ${dark ? 'text-gray-600' : 'text-gray-300'}`} />
                                <p className={`font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {bookings.length === 0 ? 'No booking requests yet.' : 'No bookings match your search.'}
                                </p>
                                {(bookingSearch || bookingFilter !== 'all') && (
                                    <button
                                        onClick={() => { setBookingSearch(''); setBookingFilter('all'); }}
                                        className="mt-3 text-brand-500 hover:text-brand-400 text-xs font-bold underline underline-offset-2"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : filteredBookings.map(b => {
                            const sc = statusCfg[b.status] || statusCfg.pending;
                            const cs = getCardStyle(b.status, b.paymentStatus);
                            const initials = b.userId?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                            return (
                                <div key={b._id} className={`rounded-2xl border-l-4 border overflow-hidden transition-all hover:shadow-lg ${cs.border} ${cs.shadow} ${dark ? 'bg-gray-800/60 border-white/10' : 'bg-white border-gray-200'}`}>
                                    {/* Status gradient top bar */}
                                    <div className={`h-1.5 w-full bg-gradient-to-r ${cs.gradient}`} />

                                    {/* Clickable Header — toggles expand */}
                                    <button
                                        onClick={() => setExpandedId(expandedId === b._id ? null : b._id)}
                                        className={`w-full px-5 pt-4 pb-4 border-b text-left flex items-start justify-between gap-3 transition ${dark ? 'border-white/8 hover:bg-white/3' : 'border-gray-100 hover:bg-gray-50/60'}`}
                                    >
                                        <h3 className={`font-bold text-base leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                                            {b.eventId?.title || <span className="italic text-gray-400">Deleted Event</span>}
                                        </h3>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex flex-col gap-1 items-end">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${sc.bg} ${sc.text}`}>
                                                    <span className="relative flex h-2 w-2">
                                                        {b.status !== 'cancelled' && (
                                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${cs.ping}`} />
                                                        )}
                                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${sc.dot}`} />
                                                    </span>
                                                    {sc.label}
                                                </span>
                                                {b.status !== 'cancelled' && (
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${payBadge[b.paymentStatus] || payBadge.not_paid}`}>
                                                        {b.paymentStatus?.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                            <FaChevronDown
                                                className={`text-xs transition-transform duration-300 ${expandedId === b._id ? 'rotate-180' : ''} ${dark ? 'text-gray-500' : 'text-gray-400'}`}
                                            />
                                        </div>
                                    </button>

                                    {/* Always-visible summary body */}
                                    <div className="px-5 py-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">{initials}</div>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-bold truncate ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{b.userId?.name}</p>
                                                <p className={`text-xs truncate ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{b.userId?.email}</p>
                                            </div>
                                        </div>

                                        <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl text-xs ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <div>
                                                <p className={`font-semibold uppercase tracking-wide mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Amount</p>
                                                <p className={`font-black text-sm ${b.amount === 0 ? 'text-emerald-500' : dark ? 'text-white' : 'text-gray-900'}`}>
                                                    {b.amount === 0 ? 'Free' : `₹${b.amount}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className={`font-semibold uppercase tracking-wide mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Booked At</p>
                                                <p className={`font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{fmtDT(b.bookedAt)}</p>
                                            </div>
                                            {b.eventId && (
                                                <div className="col-span-2 pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
                                                    <p className={`font-semibold uppercase tracking-wide mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Seats Available</p>
                                                    <p className={`font-black text-sm ${b.eventId.availableSeats > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {b.eventId.availableSeats}
                                                        <span className={`font-normal text-xs ml-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>/ {b.eventId.totalSeats} total</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded details panel */}
                                    {expandedId === b._id && (
                                        <div className={`px-5 pb-4 border-t animate-fade-in ${
                                            dark ? 'border-white/8 bg-white/3' : 'border-gray-100 bg-gray-50/60'
                                        }`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-4 mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Event Details</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                                                {b.eventId ? (
                                                    <>
                                                        <div>
                                                            <p className={`font-semibold uppercase tracking-wide mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Date</p>
                                                            <p className={`font-medium flex items-center gap-1 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                <FaCalendarAlt className="text-brand-400 text-[9px]" /> {fmt(b.eventId.date)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className={`font-semibold uppercase tracking-wide mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Location</p>
                                                            <p className={`font-medium flex items-center gap-1 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                <FaMapMarkerAlt className="text-rose-400 text-[9px]" /> {b.eventId.location}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className={`font-semibold uppercase tracking-wide mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Category</p>
                                                            <p className={`font-medium flex items-center gap-1 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                                <FaTag className="text-amber-400 text-[9px]" /> {b.eventId.category}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className={`font-semibold uppercase tracking-wide mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Ticket Price</p>
                                                            <p className={`font-black ${b.eventId.ticketPrice === 0 ? 'text-emerald-500' : dark ? 'text-white' : 'text-gray-900'}`}>
                                                                {b.eventId.ticketPrice === 0 ? 'Free' : `₹${b.eventId.ticketPrice}`}
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="col-span-2 italic text-gray-400">Event has been deleted.</p>
                                                )}
                                                <div className="col-span-2 pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
                                                    <p className={`font-semibold uppercase tracking-wide mb-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Booking ID</p>
                                                    <p className={`font-mono text-[11px] tracking-wide ${dark ? 'text-gray-400' : 'text-gray-500'}`}>#{b._id.toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {b.status === 'pending' && (
                                        <div className="px-5 pb-5 flex flex-wrap gap-2">
                                            <button onClick={() => handleConfirm(b._id, 'paid')}
                                                className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-md hover:-translate-y-0.5">
                                                <FaCheckCircle className="text-[10px]" /> Approve Paid
                                            </button>
                                            <button onClick={() => handleConfirm(b._id, 'not_paid')}
                                                className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl border transition hover:-translate-y-0.5 ${dark ? 'bg-white/8 border-white/15 text-gray-200 hover:bg-white/15' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                                                <FaCheckCircle className="text-[10px]" /> Approve
                                            </button>
                                            <button onClick={() => handleReject(b._id)}
                                                className="flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-md hover:-translate-y-0.5">
                                                <FaTimesCircle className="text-[10px]" /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (() => {
                const filteredUsers = users.filter(u => {
                    const q = userSearch.toLowerCase();
                    return !q
                        || u.name?.toLowerCase().includes(q)
                        || u.email?.toLowerCase().includes(q)
                        || u.role?.toLowerCase().includes(q);
                });
                return (
                    <div className="space-y-5">
                        {/* Search bar — same pattern as bookings search */}
                        <div className="relative flex-1 max-w-md">
                            <FaSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                placeholder="Search by name, email or role…"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ${dark
                                    ? 'bg-gray-800/60 border-white/10 text-gray-100 placeholder-gray-500'
                                    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                                }`}
                            />
                            {userSearch && (
                                <button
                                    onClick={() => setUserSearch('')}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        {/* Results count */}
                        <p className={`text-xs font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Showing <span className={`font-bold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{filteredUsers.length}</span> of {users.length} users
                        </p>

                        {/* User table */}
                        <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-white/10 bg-gray-800/40' : 'border-gray-200 bg-white'}`}>
                            {filteredUsers.length === 0 ? (
                                <div className="p-16 text-center">
                                    <FaUsers className={`mx-auto text-4xl mb-3 ${dark ? 'text-gray-600' : 'text-gray-300'}`} />
                                    <p className={`font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {users.length === 0 ? 'No users found.' : 'No users match your search.'}
                                    </p>
                                    {userSearch && (
                                        <button
                                            onClick={() => setUserSearch('')}
                                            className="mt-3 text-brand-500 hover:text-brand-400 text-xs font-bold underline underline-offset-2"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-white/8">
                                    {filteredUsers.map((u) => {
                                        const initials = u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                                        const isSelf = u._id === user?._id;
                                        const isTargetSuperAdmin = u.isSuperAdmin;
                                        // Super admin can act on anyone except themselves and other super admins
                                        // Regular admins can only suspend regular users
                                        const canChangeRole = user?.isSuperAdmin && !isSelf && !isTargetSuperAdmin;
                                        const canSuspend = !isSelf && !isTargetSuperAdmin && (user?.isSuperAdmin || u.role === 'user');
                                        return (
                                            <div key={u._id} className={`flex flex-wrap items-center gap-4 px-6 py-4 transition group ${dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                                {/* Avatar + super admin crown */}
                                                <div className="relative shrink-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black ${
                                                        isTargetSuperAdmin
                                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                                            : 'bg-gradient-to-br from-brand-500 to-indigo-600'
                                                    }`}>{initials}</div>
                                                    {isTargetSuperAdmin && (
                                                        <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-amber-400 border-2 border-white dark:border-gray-900 flex items-center justify-center" title="Super Admin">
                                                            <FaCrown className="text-white text-[8px]" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Name + email */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-bold text-sm truncate ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{u.name}</p>
                                                    <p className={`text-xs truncate ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{u.email}</p>
                                                </div>

                                                {/* Badges */}
                                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                    {/* Super Admin badge — shown first and prominently */}
                                                    {isTargetSuperAdmin && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                                            <FaCrown className="text-[9px]" /> Super Admin
                                                        </span>
                                                    )}
                                                    {/* Role badge */}
                                                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                        u.role === 'admin'
                                                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                                            : dark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        <FaUserShield className="text-[9px]" />
                                                        {u.role}
                                                    </span>

                                                    {/* Suspended badge */}
                                                    {u.isSuspended && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                                                            <FaBan className="text-[9px]" /> Suspended
                                                        </span>
                                                    )}

                                                    {/* Booking count */}
                                                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                        dark ? 'bg-white/8 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        <FaTicketAlt className="text-[9px]" />
                                                        {u.totalBookings} booking{u.totalBookings !== 1 ? 's' : ''}
                                                    </span>

                                                    {/* Joined date */}
                                                    <span className={`text-[10px] font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        Joined {fmt(u.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Action buttons — always visible, no hover opacity trick */}
                                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                    {/* Inline confirm prompt replaces window.confirm */}
                                                    {confirmState?.userId === u._id ? (
                                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold animate-fade-in ${
                                                            dark ? 'bg-gray-700 border-white/15 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-700'
                                                        }`}>
                                                            <span className={`${
                                                                confirmState.danger
                                                                    ? 'text-red-500 dark:text-red-400'
                                                                    : dark ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>{confirmState.label}</span>
                                                            <button
                                                                onClick={executeConfirm}
                                                                className={`${confirmState.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'} text-white px-2.5 py-1 rounded-lg transition`}
                                                            >Yes</button>
                                                            <button
                                                                onClick={() => setConfirmState(null)}
                                                                className={`px-2.5 py-1 rounded-lg border transition ${
                                                                    dark ? 'border-white/20 text-gray-400 hover:bg-white/10' : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                                                                }`}
                                                            >No</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Make Admin / Remove Admin — super admin only */}
                                                            {canChangeRole && (
                                                                <button
                                                                    onClick={() => handleUpdateUserRole(u)}
                                                                    className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border transition hover:-translate-y-0.5 ${
                                                                        u.role === 'admin'
                                                                            ? dark
                                                                                ? 'bg-white/8 border-white/15 text-gray-200 hover:bg-white/15'
                                                                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                                                            : 'bg-indigo-500 hover:bg-indigo-600 text-white border-transparent shadow-md'
                                                                    }`}
                                                                >
                                                                    <FaUserShield className="text-[10px]" />
                                                                    {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                                </button>
                                                            )}

                                                            {/* Suspend / Unsuspend */}
                                                            {canSuspend && (
                                                                <button
                                                                    onClick={() => handleToggleUserStatus(u)}
                                                                    className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl transition hover:-translate-y-0.5 ${
                                                                        u.isSuspended
                                                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                                                                            : 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                                                                    }`}
                                                                >
                                                                    <FaBan className="text-[10px]" />
                                                                    {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                                                                </button>
                                                            )}

                                                            {/* Delete — super admin only, not self, not another super admin */}
                                                            {user?.isSuperAdmin && !isSelf && !isTargetSuperAdmin && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u)}
                                                                    className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition hover:-translate-y-0.5"
                                                                    title="Permanently delete user and all bookings"
                                                                >
                                                                    <FaTrashAlt className="text-[10px]" />
                                                                    Delete
                                                                </button>
                                                            )}

                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Events Tab */}
            {tab === 'events' && (
                <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-white/10 bg-gray-800/40' : 'border-gray-200 bg-white'}`}>
                    {events.length === 0 ? (
                        <div className="p-16 text-center">
                            <FaCalendarAlt className={`mx-auto text-4xl mb-3 ${dark ? 'text-gray-600' : 'text-gray-300'}`} />
                            <p className={`font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No events yet. Create one!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-white/8">
                            {events.map((ev, i) => (
                                <div key={ev._id} className={`flex items-center gap-4 px-6 py-4 transition group ${dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm truncate mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{ev.title}</p>
                                        <div className="flex flex-wrap gap-3">
                                            <span className={`flex items-center gap-1 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}><FaCalendarAlt className="text-brand-400 text-[9px]" /> {fmt(ev.date)}</span>
                                            <span className={`flex items-center gap-1 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}><FaMapMarkerAlt className="text-rose-400 text-[9px]" /> {ev.location}</span>
                                            <span className={`flex items-center gap-1 text-xs font-medium ${ev.availableSeats > 0 ? 'text-emerald-500' : 'text-red-500'}`}><FaChair className="text-[9px]" /> {ev.availableSeats}/{ev.totalSeats} seats</span>
                                            <span className={`flex items-center gap-1 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}><FaTag className="text-amber-400 text-[9px]" /> {ev.category}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`text-sm font-black ${ev.ticketPrice === 0 ? 'text-emerald-500' : dark ? 'text-white' : 'text-gray-900'}`}>
                                            {ev.ticketPrice === 0 ? 'Free' : `₹${ev.ticketPrice}`}
                                        </span>
                                    </div>
                                    <button onClick={() => handleDeleteEvent(ev._id)}
                                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 dark:border-red-800/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition opacity-0 group-hover:opacity-100"
                                        title="Delete event">
                                        <FaTrashAlt className="text-xs" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            </div>

            {/* Create Event Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ position: 'fixed' }}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-fade-in ${dark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'}`}>
                        {/* Modal Header */}
                        <div className={`sticky top-0 z-10 flex items-center justify-between px-7 py-5 rounded-t-3xl border-b ${dark ? 'bg-gray-900/95 border-white/8' : 'bg-white/95 border-gray-100'}`}
                            style={{ backdropFilter: 'blur(8px)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
                                    <FaPlus className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className={`text-lg font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Create New Event</h2>
                                    <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Fill in the details below to publish</p>
                                </div>
                            </div>
                            <button onClick={() => setShowForm(false)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${dark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreateEvent} className="p-7 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Event Title" dark={dark}><input required type="text" placeholder="e.g. Tech Summit 2026" className={inputCls(dark)} value={formData.title} onChange={upd('title')} /></Field>
                                <Field label="Category" dark={dark}><input required type="text" placeholder="e.g. Tech, Music, Sports" className={inputCls(dark)} value={formData.category} onChange={upd('category')} /></Field>
                                <Field label="Date" dark={dark}><input required type="date" min={new Date().toISOString().split('T')[0]} className={inputCls(dark)} value={formData.date} onChange={upd('date')} /></Field>
                                <Field label="Location" dark={dark}><input required type="text" placeholder="Venue / City" className={inputCls(dark)} value={formData.location} onChange={upd('location')} /></Field>
                                <Field label="Total Seats" dark={dark}><input required type="number" min="1" placeholder="e.g. 200" className={inputCls(dark)} value={formData.totalSeats} onChange={upd('totalSeats')} /></Field>
                                <Field label="Ticket Price (₹)" dark={dark}><input required type="number" min="0" placeholder="0 for free" className={inputCls(dark)} value={formData.ticketPrice} onChange={upd('ticketPrice')} /></Field>
                            </div>
                            <Field label="Image URL (optional)" dark={dark}><input type="text" placeholder="https://example.com/image.jpg" className={inputCls(dark)} value={formData.image} onChange={upd('image')} /></Field>
                            <Field label="Description" dark={dark}><textarea required rows={4} placeholder="Describe the event…" className={`${inputCls(dark)} resize-none`} value={formData.description} onChange={upd('description')} /></Field>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className={`flex-1 py-3 rounded-xl border font-bold text-sm transition ${dark ? 'border-white/15 text-gray-300 hover:bg-white/8' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-black py-3 rounded-xl transition shadow-lg hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2">
                                    <FaPlus className="text-xs" /> Publish Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminDashboard;
