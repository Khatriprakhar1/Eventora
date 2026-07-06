import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaTicketAlt } from 'react-icons/fa';

const PaymentSuccess = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fade-in">
            {/* Glow backdrop */}
            <div className="absolute w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

            <div className="relative bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-gray-100">
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-emerald-400 to-teal-500" />

                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <FaCheckCircle className="text-emerald-500 text-4xl" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-3">Booking Confirmed!</h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Your ticket has been booked successfully. A confirmation email has been sent to your registered email address.
                </p>

                <div className="space-y-3">
                    <Link
                        to="/dashboard"
                        className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg shadow-emerald-100 hover:-translate-y-0.5"
                    >
                        <FaTicketAlt /> View My Bookings
                    </Link>
                    <Link
                        to="/"
                        className="block w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition border border-gray-200"
                    >
                        Discover More Events
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
