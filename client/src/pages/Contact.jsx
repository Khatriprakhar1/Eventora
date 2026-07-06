import React, { useState } from 'react';
import api from '../utils/axios';
import { FaEnvelope, FaMapMarkerAlt, FaClock, FaChevronDown, FaChevronUp, FaGithub, FaLinkedin, FaPaperPlane } from 'react-icons/fa';

const faqs = [
    { q: 'How do I book a ticket?', a: 'Browse events on the home page, click on the one you want, then click "Confirm Registration". You\'ll receive an OTP on your email to verify and complete the booking.' },
    { q: 'How does admin approval work?', a: 'After your OTP-verified booking request is submitted, the event organizer (admin) will review and confirm or reject it. You\'ll see the status update in your dashboard in real time.' },
    { q: 'Can I cancel my booking?', a: 'Yes! Go to your Dashboard and click "Cancel" on any pending or confirmed booking. Note that cancellation policies may vary per event.' },
    { q: 'Is my payment information secure?', a: 'Absolutely. We use industry-standard security practices. Payment status is handled by the admin, and no raw card data is stored on our servers.' },
    { q: 'How do I become an event organizer?', a: 'Reach out to us via the contact form below! We\'ll review your request and grant admin access so you can start publishing events.' },
];

const FAQ = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
            <button
                className="w-full flex justify-between items-center text-left p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <span className="font-semibold text-gray-800 dark:text-gray-100 pr-4">{q}</span>
                {open
                    ? <FaChevronUp className="text-brand-500 shrink-0" />
                    : <FaChevronDown className="text-gray-400 shrink-0" />
                }
            </button>
            {open && (
                <div className="px-5 pb-5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm leading-relaxed animate-fade-in">
                    {a}
                </div>
            )}
        </div>
    );
};

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/contact', form);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">

            {/* Hero */}
            <div className="text-center mb-12">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-full mb-4">
                    Get In Touch
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                    We'd Love to <span className="text-brand-600 dark:text-brand-400">Hear From You</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
                    Questions, feedback, partnership ideas — we read every message and respond within 24 hours.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-14">

                {/* Contact Info */}
                <div className="space-y-5">
                    {[
                        { icon: <FaEnvelope className="text-brand-500" />, label: 'Email', value: 'prakharkhatrii@gmail.com' },
                        { icon: <FaMapMarkerAlt className="text-brand-500" />, label: 'Based in', value: 'India 🇮🇳' },
                        { icon: <FaClock className="text-brand-500" />, label: 'Response time', value: 'Within 24 hours' },
                    ].map(({ icon, label, value }) => (
                        <div key={label}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
                        >
                            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0 text-lg">
                                {icon}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{value}</p>
                            </div>
                        </div>
                    ))}

                    {/* Social links */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Connect with me</p>
                        <div className="flex flex-col gap-3">
                            <a
                                href="https://github.com/Khatriprakhar1"
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                                    <FaGithub className="text-white text-base" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">GitHub</p>
                                    <p className="text-xs text-gray-400 truncate">@Khatriprakhar1</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </a>

                            <a
                                href="https://linkedin.com/in/prakharkhatri"
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                                    <FaLinkedin className="text-white text-base" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">LinkedIn</p>
                                    <p className="text-xs text-gray-400 truncate">Prakhar Khatri</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-2">
                    {submitted ? (
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-10 text-center shadow-sm h-full flex flex-col items-center justify-center animate-fade-in">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-4xl text-emerald-500 mb-5">✓</div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                            <p className="text-gray-500 dark:text-gray-400">We'll get back to you within 24 hours.</p>
                            <button
                                className="mt-6 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl transition"
                                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                            >
                                Send Another
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-7 shadow-sm"
                        >
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Send a Message</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Your Name</label>
                                    <input
                                        required type="text" placeholder="Your Name"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
                                    <input
                                        required type="email" placeholder="you@email.com"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm"
                                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Subject</label>
                                <input
                                    required type="text" placeholder="Partnership / Bug / Feedback"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm"
                                    value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Message</label>
                                <textarea
                                    required rows={5} placeholder="Tell us what's on your mind..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm resize-none"
                                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                />
                            </div>
                            {error && (
                                <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                ) : <FaPaperPlane />}
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* FAQ */}
            <div>
                <div className="text-center mb-8">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-full mb-3">
                        FAQ
                    </span>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-3">
                    {faqs.map(faq => <FAQ key={faq.q} {...faq} />)}
                </div>
            </div>
        </div>
    );
};

export default Contact;
