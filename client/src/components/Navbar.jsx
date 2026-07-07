import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaTicketAlt, FaBars, FaTimes, FaSun, FaMoon, FaUser, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

/* ─── Pill slider toggle ────────────────────────────────────────────────── */
const ThemeToggle = ({ dark, toggle }) => (
    <button
        onClick={toggle}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="relative flex items-center w-[52px] h-[28px] rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        style={{
            background: dark ? '#4f46e5' : '#d1d5db',
            border: dark ? '1.5px solid rgba(129,140,248,0.35)' : '1.5px solid #9ca3af',
        }}
    >
        <span
            className="absolute top-[2px] w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all duration-300"
            style={{
                left: dark ? 'calc(100% - 24px)' : '2px',
                background: '#ffffff',
                boxShadow: dark ? '0 1px 6px rgba(99,102,241,0.5)' : '0 1px 4px rgba(0,0,0,0.18)',
            }}
        >
            {dark
                ? <FaMoon className="text-indigo-600" style={{ fontSize: '9px' }} />
                : <FaSun className="text-amber-400" style={{ fontSize: '10px' }} />
            }
        </span>
        <span
            className="absolute text-[9px] pointer-events-none select-none"
            style={{ left: dark ? '6px' : 'auto', right: dark ? 'auto' : '6px', opacity: 0.45, color: dark ? '#a5b4fc' : '#6b7280' }}
        >
            {dark ? <FaSun /> : <FaMoon />}
        </span>
    </button>
);

/* ─── User Avatar Dropdown ──────────────────────────────────────────────── */
const UserDropdown = ({ user, handleLogout, dark }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                    dark
                        ? 'bg-white/8 hover:bg-white/15 border-white/12 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                }`}
            >
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-white/20">
                    {user.avatar
                        ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">{initials}</div>
                    }
                </div>
                <span className="text-sm font-semibold">{user.name?.split(' ')[0]}</span>
                <FaChevronDown className={`text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-xl overflow-hidden z-50 animate-fade-in ${
                        dark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
                    }`}
                >
                    <div className={`px-4 py-3 border-b ${dark ? 'border-white/10' : 'border-gray-100'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Signed in as</p>
                        <p className={`text-sm font-bold truncate mt-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{user.email}</p>
                    </div>
                    <div className="py-1.5">
                        {[
                            { to: '/profile', icon: <FaUser className="text-xs" />, label: 'My Profile' },
                        ].concat(
                            user.role !== 'admin'
                                ? [{ to: '/tickets', icon: <FaTicketAlt className="text-xs" />, label: 'My Tickets' }]
                                : []
                        ).concat([
                            { to: user.role === 'admin' ? '/admin' : '/dashboard', icon: null, label: user.role === 'admin' ? 'Admin Panel' : 'Dashboard' },
                        ]).map(({ to, icon, label }) => (
                            <Link
                                key={to} to={to}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                                    dark ? 'text-gray-300 hover:bg-white/8 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                {icon && <span className={dark ? 'text-gray-400' : 'text-gray-400'}>{icon}</span>}
                                {label}
                            </Link>
                        ))}
                    </div>
                    <div className={`border-t py-1.5 ${dark ? 'border-white/10' : 'border-gray-100'}`}>
                        <button
                            onClick={() => { setOpen(false); handleLogout(); }}
                            className="flex items-center gap-2.5 px-4 py-2.5 w-full text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <FaSignOutAlt className="text-xs" /> Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Navbar ────────────────────────────────────────────────────────────── */
const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { dark, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMobileOpen(false);
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const NavLink = ({ to, children, onClick }) => (
        <Link
            to={to}
            onClick={onClick}
            className={`relative text-sm font-semibold transition-colors duration-200 group ${isActive(to)
                ? dark ? 'text-brand-300' : 'text-brand-600'
                : dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
        >
            {children}
            <span className={`absolute -bottom-1 left-0 h-0.5 rounded-full transition-all duration-300 ${dark ? 'bg-brand-400' : 'bg-brand-500'} ${isActive(to) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
        </Link>
    );

    const navStyle = dark
        ? { background: 'rgba(15, 12, 41, 0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
        : { background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' };

    const borderClass = dark ? 'border-white/10' : 'border-gray-200/80';

    return (
        <nav className={`sticky top-0 z-50 border-b ${borderClass} transition-colors duration-300`} style={navStyle}>
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to={user?.role === 'admin' ? '/admin' : '/'} className="flex items-center gap-2.5 group shrink-0">
                        <svg width="32" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-105 transition-transform shrink-0">
                            <circle cx="256" cy="256" r="256" fill={dark ? "#ffffff" : "#000000"} />
                            <path d="M 180 141 L 332 141 L 332 187 L 226 187 L 226 233 L 310 233 L 310 279 L 226 279 L 226 325 L 332 325 L 332 371 L 180 371 Z" fill={dark ? "#000000" : "#ffffff"} />
                        </svg>
                        <span className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                            Event<span className="text-brand-500">ora</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links (Centered) – hidden for admin */}
                    {user?.role !== 'admin' && (
                        <div className="hidden md:flex items-center gap-7">
                            <NavLink to="/">Events</NavLink>
                            <NavLink to="/categories">Browse</NavLink>
                            <NavLink to="/about">About</NavLink>
                            <NavLink to="/contact">Contact</NavLink>
                        </div>
                    )}

                    {/* Desktop Right Side */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle dark={dark} toggle={toggle} />

                        {user ? (
                            <UserDropdown user={user} handleLogout={handleLogout} dark={dark} />
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`text-sm font-semibold transition-colors ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md shadow-brand-900/20 transition hover:-translate-y-0.5"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile: toggle + hamburger */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle dark={dark} toggle={toggle} />
                        <button
                            className={`p-2 rounded-lg transition ${dark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className={`md:hidden border-t py-4 flex flex-col gap-3 animate-fade-in ${borderClass}`}>
                        {user?.role !== 'admin' && [
                            { to: '/', label: 'Events' },
                            { to: '/categories', label: 'Browse' },
                            { to: '/about', label: 'About' },
                            { to: '/contact', label: 'Contact' },
                        ].map(({ to, label }) => (
                            <Link
                                key={to} to={to}
                                onClick={() => setMobileOpen(false)}
                                className={`font-semibold px-2 py-1 transition rounded-lg ${isActive(to)
                                    ? dark ? 'text-brand-300' : 'text-brand-600'
                                    : dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {label}
                            </Link>
                        ))}

                        <div className={`pt-3 border-t flex flex-col gap-2 ${borderClass}`}>
                            {user ? (
                                <>
                                    <Link to="/profile" onClick={() => setMobileOpen(false)} className={`font-semibold px-2 py-1 transition ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>My Profile</Link>
                                    {user.role !== 'admin' && (
                                        <Link to="/tickets" onClick={() => setMobileOpen(false)} className={`font-semibold px-2 py-1 transition ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>My Tickets</Link>
                                    )}
                                    <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)} className={`font-semibold px-2 py-1 transition ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                                        {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="mt-1 w-full text-left font-bold px-2 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm flex items-center gap-2"
                                    >
                                        <FaSignOutAlt /> Log out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setMobileOpen(false)} className={`w-full text-center font-semibold py-2 transition ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Log in</Link>
                                    <Link to="/register" onClick={() => setMobileOpen(false)} className="w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-lg transition">Sign Up</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
