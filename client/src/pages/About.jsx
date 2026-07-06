import React from 'react';
import { Link } from 'react-router-dom';
import { FaTicketAlt, FaUsers, FaCalendarCheck, FaShieldAlt, FaHeart, FaBolt, FaGlobe } from 'react-icons/fa';

const stats = [
    { value: '500+', label: 'Events Hosted', icon: <FaCalendarCheck /> },
    { value: '10K+', label: 'Happy Attendees', icon: <FaUsers /> },
    { value: '50+', label: 'Cities Covered', icon: <FaGlobe /> },
    { value: '99.9%', label: 'Uptime', icon: <FaShieldAlt /> },
];

const values = [
    {
        icon: <FaHeart className="text-2xl text-pink-500" />,
        title: 'Community First',
        desc: 'Every feature we build is driven by what our community actually needs. We listen, iterate, and grow together.',
    },
    {
        icon: <FaBolt className="text-2xl text-amber-500" />,
        title: 'Effortless Experience',
        desc: 'From booking a ticket to managing an event, everything should feel smooth, fast, and delightful.',
    },
    {
        icon: <FaShieldAlt className="text-2xl text-brand-500" />,
        title: 'Trust & Security',
        desc: 'OTP verification, secure payments, and robust admin controls — your data and experience are always protected.',
    },
];

const team = [
    { name: 'Prakhar', role: 'Founder & Lead Developer', initials: 'P', color: 'from-brand-500 to-indigo-600' },
    { name: 'Eventora Team', role: 'Design & Engineering', initials: 'E', color: 'from-pink-500 to-rose-600' },
    { name: 'Our Community', role: 'Testers & Believers', initials: 'C', color: 'from-emerald-500 to-teal-600' },
];

const About = () => {
    return (
        <div className="max-w-5xl mx-auto animate-fade-in">

            {/* Hero */}
            <div
                className="relative rounded-3xl overflow-hidden mb-14 p-10 md:p-16 text-center"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}
            >
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(30%,-30%)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #c7d2fe, transparent)', transform: 'translate(-30%, 30%)' }} />

                <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <FaTicketAlt className="text-white text-3xl" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                        We're Building the Future<br />
                        <span className="text-brand-300">of Live Experiences</span>
                    </h1>
                    <p className="text-brand-200 text-lg max-w-2xl mx-auto leading-relaxed">
                        Eventora connects passionate organizers with curious attendees — making every event
                        discovery, booking, and experience seamless and memorable.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-14">
                {stats.map(({ value, label, icon }) => (
                    <div key={label}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-3 text-brand-600 dark:text-brand-400 text-xl group-hover:scale-110 transition-transform">
                            {icon}
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Mission */}
            <div className="grid md:grid-cols-2 gap-8 mb-14 items-center">
                <div>
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-full mb-4">
                        Our Mission
                    </span>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                        Bringing People Together,<br />One Event at a Time
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        We started Eventora because we believed that discovering and attending great events
                        shouldn't be hard. Whether it's a tech conference, a music gig, a workshop, or a
                        community meetup — everyone deserves easy access to moments that matter.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Our platform is built with care — secure OTP verification, a clean booking flow, and
                        transparent admin management — so both organizers and attendees can focus on what
                        truly matters: the event itself.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {values.map(({ icon, title, desc }) => (
                        <div key={title}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex gap-4 hover:shadow-md transition-all duration-300"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                {icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team */}
            <div className="mb-14">
                <div className="text-center mb-8">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-full mb-3">
                        The People
                    </span>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Built with ❤️</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {team.map(({ name, role, initials, color }) => (
                        <div key={name}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-7 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-lg`}>
                                {initials}
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div
                className="rounded-3xl p-10 text-center"
                style={{ background: 'linear-gradient(135deg, #1e1b4b, #4338ca)' }}
            >
                <h2 className="text-3xl font-black text-white mb-3">Ready to Explore Events?</h2>
                <p className="text-brand-200 mb-6">Join thousands of attendees discovering amazing experiences.</p>
                <div className="flex justify-center gap-4 flex-wrap">
                    <Link to="/" className="bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition shadow-md hover:-translate-y-0.5">
                        Browse Events
                    </Link>
                    <Link to="/contact" className="border border-white/30 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition">
                        Get in Touch
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default About;
