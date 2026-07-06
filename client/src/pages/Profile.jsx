import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaShieldAlt, FaCalendarAlt, FaCamera, FaTrash, FaEye, FaEyeSlash, FaTimesCircle } from 'react-icons/fa';

/* Compress an image file using canvas → returns base64 string */
const compressImage = (file, maxWidth = 300, quality = 0.75) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const Profile = () => {
    const { user, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [nameCooldown, setNameCooldown] = useState(null);

    // Avatar state
    const [avatarPreview, setAvatarPreview] = useState(null); // what we show
    const [pendingAvatar, setPendingAvatar] = useState(undefined); // undefined = no change, null = remove, string = new
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState('');


    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        setName(user.name || '');
        setEmail(user.email || '');
        api.get('/profile').then(({ data }) => {
            updateUser(data);
            setAvatarPreview(data.avatar || null);
            if (data.nameLastChangedAt) {
                const daysSince = (Date.now() - new Date(data.nameLastChangedAt).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince < 7) {
                    const daysLeft = Math.ceil(7 - daysSince);
                    const nextDate = new Date(data.nameLastChangedAt);
                    nextDate.setDate(nextDate.getDate() + 7);
                    setNameCooldown({ daysLeft, nextChangeDate: nextDate });
                } else {
                    setNameCooldown(null);
                }
            }
        }).catch(() => {});
    }, [navigate]);

    /* Handle file pick → compress → set preview */
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setAvatarError('Please select an image file.');
            return;
        }
        setAvatarError('');
        try {
            const compressed = await compressImage(file);
            setAvatarPreview(compressed);
            setPendingAvatar(compressed);
        } catch {
            setAvatarError('Failed to process image. Try another file.');
        }
    };

    /* Save avatar immediately on pick */
    const saveAvatar = async (base64) => {
        setAvatarLoading(true);
        setAvatarError('');
        try {
            const { data } = await api.put('/profile', { name: user.name, avatar: base64 });
            updateUser(data.user);
            setAvatarPreview(data.user.avatar);
            setPendingAvatar(undefined);
            setSuccess('Profile picture updated!');
        } catch (err) {
            setAvatarError(err.response?.data?.message || 'Failed to save picture.');
        } finally {
            setAvatarLoading(false);
        }
    };

    /* Pick → compress → auto-save */
    const handleFileChangeAndSave = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setAvatarError('Please select an image file (JPG, PNG, WEBP…)');
            return;
        }
        setAvatarError('');
        try {
            const compressed = await compressImage(file);
            setAvatarPreview(compressed);
            await saveAvatar(compressed);
        } catch {
            setAvatarError('Failed to process image. Try another file.');
        }
    };

    /* Remove avatar */
    const handleRemoveAvatar = async () => {
        setAvatarLoading(true);
        setAvatarError('');
        try {
            const { data } = await api.delete('/profile/avatar');
            updateUser(data.user);
            setAvatarPreview(null);
            setPendingAvatar(undefined);
            setSuccess('Profile picture removed.');
        } catch (err) {
            setAvatarError(err.response?.data?.message || 'Failed to remove picture.');
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        if (newPassword && newPassword !== confirmPassword) {
            return setError('New passwords do not match.');
        }

        setLoading(true);
        try {
            const payload = { name };
            if (newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }
            const { data } = await api.put('/profile', payload);
            updateUser(data.user);
            setSuccess('Profile updated successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
            const errData = err.response?.data;
            if (err.response?.status === 429 && errData?.nextChangeDate) {
                setNameCooldown({
                    daysLeft: errData.daysLeft,
                    nextChangeDate: new Date(errData.nextChangeDate),
                });
            }
            setError(errData?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : 'Member';

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">

            {/* Profile Header */}
            <div
                className="relative rounded-3xl overflow-hidden mb-8 p-8 md:p-10"
                style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)' }}
            >
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(30%,-30%)' }} />
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">

                    {/* Avatar with edit overlay */}
                    <div className="relative shrink-0 group">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/20 flex items-center justify-center text-4xl font-black text-white">
                                    {initials}
                                </div>
                            )}
                        </div>
                        {/* Camera overlay button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarLoading}
                            title="Change profile picture"
                            className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                            {avatarLoading
                                ? <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                : <FaCamera className="text-white text-xl" />
                            }
                        </button>
                        {/* Remove button */}
                        {avatarPreview && !avatarLoading && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                title="Remove profile picture"
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition"
                            >
                                <FaTrash className="text-white text-[9px]" />
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChangeAndSave}
                        />
                    </div>

                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">{user?.name}</h1>
                        <p className="text-brand-200 text-sm mb-1">{user?.email}</p>
                        {avatarError && <p className="text-red-300 text-xs mb-2">{avatarError}</p>}
                        <p className="text-brand-300 text-xs mb-3 opacity-70">Hover the photo to change it</p>
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                user?.role === 'admin'
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    : 'bg-white/10 text-brand-200 border border-white/15'
                            }`}>
                                <FaShieldAlt className="text-xs" />
                                {user?.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                            {user?.role !== 'admin' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-brand-200 border border-white/15">
                                    <FaCalendarAlt className="text-xs" />
                                    Since {memberSince}
                                </span>
                            )}
                            {user?.isVerified && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                    <FaCheckCircle className="text-xs" /> Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Info */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-7 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                        <FaUser className="text-brand-500" /> Basic Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                                Display Name
                                {nameCooldown && (
                                    <span className="ml-2 text-amber-500 normal-case font-normal">
                                        🔒 Locked · can change in {nameCooldown.daysLeft} day{nameCooldown.daysLeft > 1 ? 's' : ''}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text" required
                                disabled={!!nameCooldown}
                                value={name} onChange={e => setName(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl border transition text-sm focus:outline-none ${
                                    nameCooldown
                                        ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-400 focus:border-brand-400'
                                }`}
                            />
                            {nameCooldown ? (
                                <p className="text-xs text-amber-500 mt-1">
                                    Next name change available on <strong>{nameCooldown.nextChangeDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong>. You can change your name at most once per week.
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400 mt-1">You can change your name once per week.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email" disabled value={email}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">Email cannot be changed for security reasons.</p>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-7 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <FaLock className="text-brand-500" /> Change Password
                    </h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Leave blank if you don't want to change your password.</p>
                    <div className="space-y-4">

                        {/* Current Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPw.current ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm"
                                />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                                >
                                    {showPw.current ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPw.new ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:outline-none transition text-sm"
                                />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                                >
                                    {showPw.new ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password + match indicator */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showPw.confirm ? 'text' : 'password'}
                                    placeholder="Repeat new password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-3 pr-11 rounded-xl border transition text-sm focus:outline-none ${
                                        confirmPassword.length > 0
                                            ? newPassword === confirmPassword
                                                ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 text-gray-800 dark:text-gray-100'
                                                : 'border-red-400 focus:ring-2 focus:ring-red-400 bg-red-50 dark:bg-red-900/10 text-gray-800 dark:text-gray-100'
                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-400 focus:border-brand-400'
                                    }`}
                                />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                                >
                                    {showPw.confirm ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {/* Match / No-match feedback */}
                            {confirmPassword.length > 0 && (
                                <p className={`flex items-center gap-1.5 text-xs font-semibold mt-1.5 ${
                                    newPassword === confirmPassword ? 'text-emerald-500' : 'text-red-500'
                                }`}>
                                    {newPassword === confirmPassword
                                        ? <><FaCheckCircle /> Passwords match</>  
                                        : <><FaTimesCircle /> Passwords do not match</>
                                    }
                                </p>
                            )}
                        </div>

                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
                        <FaCheckCircle /> {success}
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
                    ) : null}
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};

export default Profile;
