import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/axios';
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaChair } from 'react-icons/fa';

// Rotating colour palette for dynamic category pills / badges
const PALETTE = [
    { pill: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800',   badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'   },
    { pill: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'   },
    { pill: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    { pill: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    { pill: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    { pill: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',   badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'   },
    { pill: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    { pill: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800',   badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'   },
    { pill: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',   badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'   },
    { pill: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
];

// Build a stable colour map for all categories derived from events
const buildColorMap = (categories) => {
    const map = {};
    categories.forEach((cat, i) => {
        map[cat] = PALETTE[i % PALETTE.length];
    });
    return map;
};


const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="skeleton h-44 w-full" />
        <div className="p-5 space-y-3">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-10 w-full mt-2 rounded-xl" />
        </div>
    </div>
);

const Categories = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCat = searchParams.get('cat') || 'All';
    const [selected, setSelected] = useState(initialCat);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [colorMap, setColorMap] = useState({});

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/events');
            setEvents(data);
            // Derive unique categories from actual events
            const uniqueCats = [...new Set(data.map(e => e.category).filter(Boolean))].sort();
            setColorMap(buildColorMap(uniqueCats));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (cat) => {
        setSelected(cat);
        if (cat === 'All') {
            setSearchParams({});
        } else {
            setSearchParams({ cat });
        }
    };

    // Derive sorted unique categories from live event data
    const liveCategories = [...new Set(events.map(e => e.category).filter(Boolean))].sort();

    const filtered = selected === 'All'
        ? events
        : events.filter(e => e.category === selected);

    // Helper: get pill/badge style from colorMap (fallback to first palette entry)
    const getPill = (cat) => colorMap[cat]?.pill || PALETTE[0].pill;
    const getBadge = (cat) => colorMap[cat]?.badge || PALETTE[0].badge;

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">

            {/* Header */}
            <div className="mb-8">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-full mb-3">
                    Explore
                </span>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Browse by Category</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Find events that match your interests — filter by category below.
                </p>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-3 mb-10">
                {/* All pill */}
                <button
                    onClick={() => handleSelect('All')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        selected === 'All'
                            ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-900/20'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                    }`}
                >
                    <span>🌐</span>
                    <span>All</span>
                    {!loading && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                            selected === 'All' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>{events.length}</span>
                    )}
                </button>
                {/* Dynamic category pills from live data */}
                {liveCategories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => handleSelect(cat)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            selected === cat
                                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-900/20'
                                : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-300 ${getPill(cat)}`
                        }`}
                    >
                        <span>{cat}</span>
                        {!loading && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                selected === cat ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                                {events.filter(e => e.category === cat).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No events in this category yet</h3>
                    <p className="text-gray-400 mb-6">Check back later or explore other categories.</p>
                    <button
                        onClick={() => handleSelect('All')}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl transition"
                    >
                        View All Events
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 font-medium">
                        Showing <span className="text-brand-600 dark:text-brand-400 font-bold">{filtered.length}</span> event{filtered.length !== 1 ? 's' : ''}
                        {selected !== 'All' && <> in <span className="font-bold text-gray-700 dark:text-gray-300">{selected}</span></>}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((event, i) => {
                            const seatPct = (event.availableSeats / event.totalSeats) * 100;
                            const barColor = seatPct > 50 ? 'bg-emerald-500' : seatPct > 20 ? 'bg-amber-500' : 'bg-red-500';
                            return (
                                <div
                                    key={event._id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex flex-col animate-fade-in"
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                >
                                    <div className="relative h-44">
                                        {event.image ? (
                                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-black uppercase tracking-widest text-white/60"
                                                style={{ background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)' }}>
                                                {event.category}
                                            </div>
                                        )}
                                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                                        <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${getBadge(event.category)}`}>
                                            {event.category}
                                        </span>
                                        {event.availableSeats === 0 && (
                                            <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">Sold Out</span>
                                        )}
                                    </div>
                                    <div className="p-5 flex flex-col flex-grow">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-3">{event.title}</h3>
                                        <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            <div className="flex items-center gap-2">
                                                <FaCalendarAlt className="text-brand-400 text-xs" />
                                                {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-brand-400 text-xs" />
                                                {event.location}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaTicketAlt className="text-brand-400 text-xs" />
                                                {event.ticketPrice === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Free</span> : `₹${event.ticketPrice}`}
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                <div className={`${barColor} h-1 rounded-full`} style={{ width: `${seatPct}%` }} />
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <FaChair className="text-xs text-gray-400" />
                                                <span className="text-xs text-gray-400">{event.availableSeats} / {event.totalSeats} seats</span>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/events/${event._id}`}
                                            className="mt-auto block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition hover:-translate-y-0.5 shadow-sm"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default Categories;
