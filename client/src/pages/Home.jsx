import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaRegClock, FaTicketAlt, FaShieldAlt, FaArrowRight } from 'react-icons/fa';

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="skeleton h-48 w-full" />
        <div className="p-6 space-y-3">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-2 w-full mt-4" />
            <div className="skeleton h-10 w-full mt-2 rounded-xl" />
        </div>
    </div>
);

const CATEGORY_COLORS = {
    Music: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    Tech: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Technology: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Workshop: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Conference: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Sports: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Art: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    Food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    default: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
};
const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;

const getSeatColor = (available, total) => {
    const pct = (available / total) * 100;
    if (pct > 50) return 'bg-emerald-500';
    if (pct > 20) return 'bg-amber-500';
    return 'bg-red-500';
};

const Home = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const eventsSectionRef = useRef(null);

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        const timeoutId = setTimeout(() => { fetchEvents(page); }, 400);
        return () => clearTimeout(timeoutId);
    }, [search, page]);

    const fetchEvents = async (currentPage) => {
        // Only show full skeleton on initial load or search change (page 1)
        if (currentPage === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const { data } = await api.get(`/events?search=${search}&page=${currentPage}&limit=6`);
            setEvents(data.events);
            setHasMore(data.hasMore);
            setTotalPages(Math.ceil(data.totalCount / 6) || 1);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            // Scroll to the events section (not the very top of the page)
            if (currentPage > 1 && eventsSectionRef.current) {
                eventsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero */}
            <div className="relative rounded-3xl overflow-hidden mb-14 shadow-2xl animate-fade-in" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
                <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,12,41,0.95) 0%, rgba(15,12,41,0.4) 60%, transparent 100%)' }} />
                <div className="absolute top-10 right-20 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
                <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />
                <div className="relative p-10 md:p-20 text-center flex flex-col items-center z-10">
                    <span className="bg-white/10 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-white/20 animate-slide-up">
                        ✦ Welcome to Eventora
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Find Your Next <br />
                        <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #a5b4fc, #818cf8, #c7d2fe)' }}>
                            Unforgettable
                        </span>{' '}Experience
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        Discover the best tech conferences, music festivals, and hands-on workshops. Secure your spot today.
                    </p>
                    <div className="w-full max-w-2xl mx-auto relative flex items-center shadow-2xl group animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <FaSearch className="absolute left-6 text-gray-400 text-lg z-10 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events by title..."
                            className="w-full pl-16 pr-6 py-5 rounded-2xl text-base text-gray-900 bg-white/95 backdrop-blur-sm border-2 border-transparent focus:border-brand-400 focus:outline-none transition-all placeholder-gray-400 font-medium shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14 px-1">
                {[
                    { icon: <FaRegClock />, title: 'Fast Booking', desc: 'Secure your tickets instantly with our streamlined booking infrastructure built for speed.', color: 'from-brand-500 to-brand-700', glow: 'shadow-brand-100 dark:shadow-brand-900/50' },
                    { icon: <FaTicketAlt />, title: 'Seamless Access', desc: 'Manage all your tickets right from your personal dashboard — beautifully organized.', color: 'from-pink-500 to-rose-600', glow: 'shadow-pink-100 dark:shadow-pink-900/50' },
                    { icon: <FaShieldAlt />, title: 'Secure Platform', desc: 'All registrations protected by cutting-edge 2FA OTP verification technology.', color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-100 dark:shadow-emerald-900/50' },
                ].map((feat) => (
                    <div key={feat.title} className="bg-white dark:bg-gray-800/80 dark:border-gray-700 p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1.5 transition-all duration-300 hover:shadow-lg group">
                        <div className={`w-14 h-14 bg-gradient-to-br ${feat.color} text-white rounded-2xl flex items-center justify-center text-xl mb-5 shadow-lg ${feat.glow} group-hover:scale-110 transition-transform`}>
                            {feat.icon}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                ))}
            </div>

            {/* Events Header */}
            <div ref={eventsSectionRef} className="flex items-center justify-between mb-8 px-1 border-b border-gray-200 dark:border-gray-700 pb-5">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Upcoming Events</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Find the perfect event for you</p>
                </div>
                {!loading && (
                    <div className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-sm font-bold px-4 py-1.5 rounded-full">
                        {events.length} {events.length === 1 ? 'result' : 'results'}
                    </div>
                )}
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-24 animate-fade-in">
                    <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaSearch className="text-brand-300 text-3xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No events found</h3>
                    <p className="text-gray-400">Try a different search term or check back later.</p>
                </div>
            ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event, i) => (
                        <div
                            key={event._id}
                            className="bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-brand-900/30 transition-all duration-300 flex flex-col group border border-gray-100 dark:border-gray-700 hover:-translate-y-1 animate-fade-in"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <div className="h-52 bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                                {event.image ? (
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-black uppercase tracking-widest text-white/60" style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5)' }}>
                                        {event.category || 'Event'}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-md">
                                    {event.ticketPrice === 0
                                        ? <span className="text-emerald-600">FREE</span>
                                        : <span className="text-gray-900 dark:text-white">₹{event.ticketPrice}</span>}
                                </div>
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 ${getCategoryColor(event.category)}`}>
                                    {event.category}
                                </span>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 leading-tight">{event.title}</h2>
                                <div className="flex flex-col gap-1.5 mb-4 text-gray-500 dark:text-gray-400 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-brand-400 shrink-0" />
                                        <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-brand-400 shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-1.5">
                                        <div className={`${getSeatColor(event.availableSeats, event.totalSeats)} h-1.5 rounded-full`} style={{ width: `${(event.availableSeats / event.totalSeats) * 100}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-400 mb-4">{event.availableSeats} of {event.totalSeats} seats remaining</p>
                                    <Link
                                        to={`/events/${event._id}`}
                                        className="flex items-center justify-center gap-2 w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition group/btn shadow-sm"
                                    >
                                        View Details <FaArrowRight className="text-xs group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {(page > 1 || hasMore) && (
                    <div className="flex items-center justify-center gap-4 mt-12 mb-4 animate-fade-in">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loadingMore}
                            className="bg-white dark:bg-gray-800 border-2 border-brand-100 dark:border-brand-900/50 hover:border-brand-300 dark:hover:border-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-brand-600 dark:text-brand-400 font-bold py-2.5 px-6 rounded-xl transition-all duration-300 hover:shadow-md flex items-center gap-2"
                        >
                            Previous
                        </button>
                        
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore || loadingMore}
                            className="bg-white dark:bg-gray-800 border-2 border-brand-100 dark:border-brand-900/50 hover:border-brand-300 dark:hover:border-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-brand-600 dark:text-brand-400 font-bold py-2.5 px-6 rounded-xl transition-all duration-300 hover:shadow-md flex items-center gap-2"
                        >
                            Next
                        </button>
                    </div>
                )}
            </>
            )}

            {/* Footer */}
            <footer className="mt-auto pt-16 pb-8 border-t border-gray-200 dark:border-gray-700/80 text-center">
                <div className="flex justify-center items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                        <FaTicketAlt className="text-white text-xs" />
                    </div>
                    <span className="text-lg font-black text-gray-900 dark:text-white">Event<span className="text-brand-600">ora</span></span>
                </div>
                <p className="text-gray-400 text-sm mb-4 max-w-sm mx-auto">
                    The most dynamic way to manage, discover, and host world-class events.
                </p>
                <div className="text-xs text-gray-300 dark:text-gray-500 font-medium uppercase tracking-wider">
                    &copy; {new Date().getFullYear()} Eventora Platform. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Home;
