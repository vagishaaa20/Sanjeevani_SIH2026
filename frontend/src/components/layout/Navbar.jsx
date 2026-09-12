import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Globe, LogOut, Menu, X, Heart, User, ShieldCheck, ChevronDown, Check, Clock, Calendar, Pill, CheckCheck, Sun, Moon } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import SanjeevaniLogo from '../common/SanjeevaniLogo';
import MinimalistAvatar from '../common/MinimalistAvatar';
import TranslatedText from '../common/TranslatedText';

const INDIAN_LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
];

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { currentLang, setCurrentLang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notifMenuOpen, setNotifMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    const [notifications, setNotifications] = useState([
        {
            id: 'n1',
            title: 'ABHA ID Connected',
            message: 'Your Ayushman Bharat Digital Health Card is verified and active.',
            time: '10m ago',
            read: false,
            type: 'success',
            icon: ShieldCheck,
        },
        {
            id: 'n2',
            title: 'Medication Schedule',
            message: 'Evening dose reminder: Metformin 500mg at 8:00 PM.',
            time: '1h ago',
            read: false,
            type: 'info',
            icon: Pill,
        },
        {
            id: 'n3',
            title: 'Teleconsultation Available',
            message: 'Verified doctors are available for instant AI-triaged consultations.',
            time: '2h ago',
            read: true,
            type: 'primary',
            icon: Calendar,
        },
    ]);

    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const langRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileMenuOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifMenuOpen(false);
            }
            if (langRef.current && !langRef.current.contains(e.target)) {
                setLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleMarkAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const handleDismissNotif = (id, e) => {
        e.stopPropagation();
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const unreadCount = notifications.filter((n) => !n.read).length;
    const profile = user?.profile || {};
    const userName = profile.fullName || user?.email?.split('@')[0] || user?.phone || 'Patient';
    const activeLangObj = INDIAN_LANGUAGES.find((l) => l.code === currentLang) || INDIAN_LANGUAGES[0];

    const getProfileRoute = () => {
        if (user?.role === 'patient') return '/patient/profile';
        if (user?.role === 'clinic_admin') return '/clinic/profile';
        if (user?.role === 'health_worker') return '/health-worker/profile';
        if (user?.role === 'doctor') return '/doctor/profile';
        return '/patient/dashboard';
    };

    const isDark = theme === 'dark';

    return (
        <header
            className="backdrop-blur-md py-3 px-4 md:px-8 flex justify-between items-center sticky top-0 z-40"
            style={{
                background: 'var(--navbar-bg)',
                borderBottom: '1px solid var(--border)',
            }}
        >
            {/* Left: Mobile Brand & Greeting */}
            <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2.5 font-heading md:hidden">
                    <div className="w-10 h-10 rounded-2xl border flex items-center justify-center shadow-2xs flex-shrink-0 p-1" style={{ background: 'var(--logo-gradient)', borderColor: 'var(--border)' }}>
                        <SanjeevaniLogo variant="emblem" size={32} />
                    </div>
                    <span className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Sanjeevani</span>
                </Link>

                <div className="hidden md:flex flex-col text-left">
                    <h2
                        className="text-xl font-black font-heading flex items-center gap-1.5"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <span><TranslatedText text="Good day," /> {userName}!</span>
                    </h2>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        <TranslatedText text="Empathetic clinical care at your fingertips" />
                    </p>
                </div>
            </div>

            {/* Right: Actions, Notifications, Language, Avatar */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Language Switcher */}
                <div className="relative" ref={langRef}>
                    <button
                        type="button"
                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition cursor-pointer text-xs font-bold"
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        <Globe className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span>{activeLangObj.native}</span>
                        <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                    </button>

                    {langMenuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-48 rounded-2xl shadow-xl py-2 z-50 animate-fade-in-up"
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <div
                                className="px-3 py-1 text-[10px] font-black uppercase tracking-wider border-b mb-1"
                                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                            >
                                Select Language
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {INDIAN_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setCurrentLang(lang.code);
                                            setLangMenuOpen(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer"
                                        style={{
                                            color: currentLang === lang.code ? 'var(--accent)' : 'var(--text-primary)',
                                            background: currentLang === lang.code ? 'var(--bg-surface)' : 'transparent',
                                        }}
                                        onMouseEnter={(e) => { if (currentLang !== lang.code) e.currentTarget.style.background = 'var(--bg-surface)'; }}
                                        onMouseLeave={(e) => { if (currentLang !== lang.code) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <span>{lang.native} ({lang.label})</span>
                                        {currentLang === lang.code && <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dark Mode Toggle */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    className="p-2 rounded-full transition cursor-pointer"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                    }}
                >
                    {isDark ? (
                        <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
                    ) : (
                        <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    )}
                </button>

                {/* Notification Center */}
                {user && (
                    <div className="relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                            className="relative p-2 rounded-full transition cursor-pointer"
                            title="Notifications & Updates"
                            style={{
                                background: 'var(--bg-surface)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center border-2"
                                    style={{
                                        background: 'var(--accent)',
                                        borderColor: 'var(--card-bg)',
                                    }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {notifMenuOpen && (
                            <div
                                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl shadow-xl p-4 z-50 animate-fade-in-up text-left flex flex-col gap-3"
                                style={{
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-black text-sm font-heading" style={{ color: 'var(--text-primary)' }}>
                                            Notifications
                                        </h3>
                                        {unreadCount > 0 && (
                                            <span
                                                className="px-2 py-0.5 rounded-full text-[10px] font-black"
                                                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                            >
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>

                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-[11px] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                            style={{ color: 'var(--accent)' }}
                                        >
                                            <CheckCheck className="w-3.5 h-3.5" />
                                            <span>Mark all read</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                            No notifications right now.
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const Icon = n.icon;
                                            return (
                                                <div
                                                    key={n.id}
                                                    onClick={() => {
                                                        setNotifications((prev) =>
                                                            prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                                                        );
                                                    }}
                                                    className="p-3 rounded-2xl transition-all flex items-start justify-between gap-3 cursor-pointer"
                                                    style={{
                                                        background: n.read ? 'var(--bg-surface)' : 'var(--notif-unread-bg)',
                                                        border: `1px solid ${n.read ? 'transparent' : 'var(--notif-unread-border)'}`,
                                                        opacity: n.read ? 0.8 : 1,
                                                    }}
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        <div
                                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                                                                {n.title}
                                                            </span>
                                                            <p className="text-[11px] font-medium mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                                                                {n.message}
                                                            </p>
                                                            <span className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                                <Clock className="w-3 h-3" /> {n.time}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => handleDismissNotif(n.id, e)}
                                                        className="p-1 rounded cursor-pointer transition"
                                                        title="Dismiss"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Avatar & Dropdown */}
                {user ? (
                    <div
                        className="relative pl-2"
                        style={{ borderLeft: '1px solid var(--border)' }}
                        ref={profileRef}
                    >
                        <button
                            type="button"
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="flex items-center gap-2 p-0.5 rounded-full hover:bg-[#fff0f5] transition-all cursor-pointer group"
                        >
                            <MinimalistAvatar
                                name={userName}
                                role={user.role}
                                size={36}
                                showStatus={true}
                                status="online"
                            />
                            <ChevronDown className="w-3.5 h-3.5 text-[#7d6974] group-hover:text-[#e13b68] hidden sm:block transition-colors" />
                        </button>

                        {profileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#f5e4ec] rounded-3xl shadow-xl p-4 z-50 animate-fade-in-up text-left flex flex-col gap-3">
                                <div className="flex items-center gap-3 pb-3 border-b border-[#fdf0f4]">
                                    <MinimalistAvatar
                                        name={userName}
                                        role={user.role}
                                        size={44}
                                        showStatus={false}
                                    />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{userName}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                                            {user.role?.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                                            {user.phone || user.email}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            navigate(getProfileRoute());
                                        }}
                                        className="w-full px-3 py-2 text-xs font-bold rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                                        style={{ color: 'var(--text-primary)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                    >
                                        <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                        <span>View & Edit Profile / ABHA</span>
                                    </button>

                                    {user.role === 'patient' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setProfileMenuOpen(false);
                                                    navigate('/patient/consultations');
                                                }}
                                                className="w-full px-3 py-2 text-xs font-bold rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                                                style={{ color: 'var(--text-primary)' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                            >
                                                <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                                <span>My Consultations & History</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setProfileMenuOpen(false);
                                                    navigate('/patient/doctors');
                                                }}
                                                className="w-full px-3 py-2 text-xs font-bold rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                                                style={{ color: 'var(--text-primary)' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                            >
                                                <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                                <span>Find Doctors & Reviews</span>
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                                    <button
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full px-3 py-2 text-xs font-bold rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                                        style={{ color: 'var(--accent)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-light)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link
                            to="/login"
                            className="text-xs font-bold px-3 py-1.5 transition"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 text-xs font-bold rounded-full text-white shadow-xs transition"
                            style={{ background: 'var(--accent)' }}
                        >
                            Register
                        </Link>
                    </div>
                )}

                {/* Mobile Menu Toggle */}
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-xl cursor-pointer transition"
                    style={{
                        color: 'var(--text-primary)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                    }}
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
};

export default Navbar;
