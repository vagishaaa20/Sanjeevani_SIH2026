import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Globe, LogOut, Menu, X, Heart, User, ShieldCheck, ChevronDown, Check, Clock, Calendar, Pill, CheckCheck } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/LanguageContext';
import SanjeevaniLogo from '../common/SanjeevaniLogo';

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
    const navigate = useNavigate();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notifMenuOpen, setNotifMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    // Real, interactive notifications state
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

    // Close popovers on outside click
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

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-[#f5e4ec] py-3 px-4 md:px-8 flex justify-between items-center sticky top-0 z-40">
            {/* Left: Mobile Brand & Greeting */}
            <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2.5 font-heading md:hidden">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ffe6ee] to-white border border-[#f5c6d6] flex items-center justify-center shadow-2xs flex-shrink-0 p-1">
                        <SanjeevaniLogo variant="emblem" size={32} />
                    </div>
                    <span className="text-xl font-black tracking-tight text-[#2d2329]">Sanjeevani</span>
                </Link>

                <div className="hidden md:flex flex-col text-left">
                    <h2 className="text-xl font-black text-[#2d2329] font-heading flex items-center gap-1.5">
                        <span>Good day, {userName}!</span>
                    </h2>
                    <p className="text-xs font-semibold text-[#7d6974]">
                        Empathetic clinical care at your fingertips
                    </p>
                </div>
            </div>

            {/* Center: Search Bar */}
            <div className="hidden sm:flex items-center flex-1 max-w-md mx-6">
                <div className="relative w-full">
                    <Search className="w-4 h-4 text-[#7d6974] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search doctors, symptoms, medicines..."
                        className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-full bg-[#fdf5f7] border border-[#f5e4ec] text-[#2d2329] placeholder:text-[#7d6974]/60 focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:bg-white transition"
                    />
                </div>
            </div>

            {/* Right: Actions, Notifications, Language, Avatar */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Working Indian Language Switcher Dropdown */}
                <div className="relative" ref={langRef}>
                    <button
                        type="button"
                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                        className="flex items-center gap-1.5 bg-[#fdf0f4] hover:bg-[#ffe6ee] border border-[#f5e4ec] rounded-full px-3 py-1.5 transition cursor-pointer text-xs font-bold text-[#2d2329]"
                    >
                        <Globe className="w-3.5 h-3.5 text-[#e13b68]" />
                        <span>{activeLangObj.native}</span>
                        <ChevronDown className="w-3 h-3 text-[#7d6974]" />
                    </button>

                    {langMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#f5e4ec] rounded-2xl shadow-xl py-2 z-50 animate-fade-in-up">
                            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#7d6974] border-b border-[#fdf0f4] mb-1">
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
                                        className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-[#fdf0f4] transition cursor-pointer ${
                                            currentLang === lang.code ? 'text-[#e13b68] bg-[#fdf5f7]' : 'text-[#2d2329]'
                                        }`}
                                    >
                                        <span>{lang.native} ({lang.label})</span>
                                        {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-[#e13b68]" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Single Functional Notification Center Dropdown */}
                {user && (
                    <div className="relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                            className="relative p-2 rounded-full bg-[#fdf0f4] text-[#4a3c45] hover:text-[#e13b68] hover:bg-[#ffe6ee] transition cursor-pointer"
                            title="Notifications & Updates"
                        >
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#e13b68] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {notifMenuOpen && (
                            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#f5e4ec] rounded-3xl shadow-xl p-4 z-50 animate-fade-in-up text-left flex flex-col gap-3">
                                <div className="flex items-center justify-between border-b border-[#fdf0f4] pb-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-black text-sm text-[#2d2329] font-heading">
                                            Notifications
                                        </h3>
                                        {unreadCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-[#ffe6ee] text-[#e13b68] text-[10px] font-black">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>

                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-[11px] font-bold text-[#e13b68] hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <CheckCheck className="w-3.5 h-3.5" />
                                            <span>Mark all read</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center text-xs font-semibold text-[#7d6974]">
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
                                                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                                                        n.read
                                                            ? 'bg-[#faf7f8] border-transparent opacity-80'
                                                            : 'bg-[#fff5f8] border-[#f8c8d8]'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-[#ffe6ee] flex items-center justify-center text-[#e13b68] flex-shrink-0 mt-0.5">
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-[#2d2329] leading-tight">
                                                                {n.title}
                                                            </span>
                                                            <p className="text-[11px] font-medium text-[#7d6974] mt-0.5 leading-snug">
                                                                {n.message}
                                                            </p>
                                                            <span className="text-[10px] text-[#9c8491] mt-1 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {n.time}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => handleDismissNotif(n.id, e)}
                                                        className="text-[#9c8491] hover:text-[#e13b68] p-1 rounded cursor-pointer"
                                                        title="Dismiss"
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

                {/* Interactive Profile Avatar & Dropdown */}
                {user ? (
                    <div className="relative pl-2 border-l border-[#f5e4ec]" ref={profileRef}>
                        <button
                            type="button"
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#fdf0f4] transition cursor-pointer"
                        >
                            <div className="w-9 h-9 rounded-full bg-[#ffe6ee] border-2 border-[#f8c8d8] flex items-center justify-center text-xs font-black text-[#e13b68] uppercase shadow-xs">
                                {(userName || 'P').charAt(0)}
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-[#7d6974] hidden sm:block" />
                        </button>

                        {profileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#f5e4ec] rounded-3xl shadow-xl p-4 z-50 animate-fade-in-up text-left flex flex-col gap-3">
                                <div className="flex items-center gap-3 pb-3 border-b border-[#fdf0f4]">
                                    <div className="w-11 h-11 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-base font-black text-[#e13b68]">
                                        {(userName || 'P').charAt(0)}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-black text-[#2d2329] truncate">{userName}</span>
                                        <span className="text-[10px] font-bold text-[#e13b68] uppercase tracking-wider">
                                            {user.role?.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-[#7d6974] truncate">
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
                                        className="w-full px-3 py-2 text-xs font-bold text-[#2d2329] hover:text-[#e13b68] hover:bg-[#fdf0f4] rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                                    >
                                        <User className="w-4 h-4 text-[#e13b68]" />
                                        <span>View & Edit Profile / ABHA</span>
                                    </button>

                                    {user.role === 'patient' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setProfileMenuOpen(false);
                                                    navigate('/patient/consultations');
                                                }}
                                                className="w-full px-3 py-2 text-xs font-bold text-[#2d2329] hover:text-[#e13b68] hover:bg-[#fdf0f4] rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                                            >
                                                <Calendar className="w-4 h-4 text-[#e13b68]" />
                                                <span>My Consultations & History</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setProfileMenuOpen(false);
                                                    navigate('/patient/doctors');
                                                }}
                                                className="w-full px-3 py-2 text-xs font-bold text-[#2d2329] hover:text-[#e13b68] hover:bg-[#fdf0f4] rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
                                            >
                                                <ShieldCheck className="w-4 h-4 text-[#e13b68]" />
                                                <span>Find Doctors & Reviews</span>
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-[#fdf0f4]">
                                    <button
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl text-left flex items-center gap-2.5 transition cursor-pointer"
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
                            className="text-xs font-bold text-[#2d2329] hover:text-[#e13b68] px-3 py-1.5"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 text-xs font-bold bg-[#e13b68] text-white rounded-full hover:bg-[#c92a55] shadow-xs transition"
                        >
                            Register
                        </Link>
                    </div>
                )}

                {/* Mobile Menu Toggle */}
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-[#2d2329] bg-[#fdf0f4] border border-[#f5e4ec] rounded-xl cursor-pointer"
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
};

export default Navbar;
