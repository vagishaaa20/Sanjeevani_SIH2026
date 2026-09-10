import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, MessageSquare, Globe, LogOut, Menu, X, Heart } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/LanguageContext';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { currentLang, setCurrentLang } = useLanguage();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const userName = user?.profile?.fullName || user?.email?.split('@')[0] || user?.phone || 'User';

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-[#f5e4ec] py-3 px-4 md:px-8 flex justify-between items-center sticky top-0 z-40">
            {/* Left: Mobile Brand & Greeting */}
            <div className="flex items-center gap-3">
                <Link to="/" className="text-xl font-black tracking-tight text-[#2d2329] flex items-center gap-2 font-heading md:hidden">
                    <span className="w-8 h-8 rounded-full bg-[#e13b68] flex items-center justify-center text-white shadow-xs">
                        <Heart className="w-4 h-4 fill-white" />
                    </span>
                    <span>Sanjeevani</span>
                </Link>

                <div className="hidden md:flex flex-col text-left">
                    <h2 className="text-xl font-black text-[#2d2329] font-heading flex items-center gap-1.5">
                        <span>Good morning, {userName}!</span>
                        <span className="text-base" role="img" aria-label="flower">🌸</span>
                    </h2>
                    <p className="text-xs font-semibold text-[#7d6974]">
                        Here is what's happening today
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
                        placeholder="Search patients, appointments..."
                        className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-full bg-[#fdf5f7] border border-[#f5e4ec] text-[#2d2329] placeholder:text-[#7d6974]/60 focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:bg-white transition"
                    />
                </div>
            </div>

            {/* Right: Actions, Notifications, Avatar */}
            <div className="flex items-center gap-3 md:gap-4">
                {/* Language Switcher */}
                {(!user || user?.role === 'patient') && (
                    <div className="flex items-center gap-1 bg-[#fdf0f4] border border-[#f5e4ec] rounded-full px-3 py-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#e13b68]" />
                        <select
                            value={currentLang}
                            onChange={(e) => setCurrentLang(e.target.value)}
                            className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-[#2d2329]"
                        >
                            <option value="en">English</option>
                            <option value="hi">हिन्दी</option>
                            <option value="bn">বাংলা</option>
                        </select>
                    </div>
                )}

                {/* Notifications & Messages Cues */}
                {user && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="relative p-2 rounded-full bg-[#fdf0f4] text-[#4a3c45] hover:text-[#e13b68] hover:bg-[#ffe6ee] transition cursor-pointer"
                            title="Messages"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#e13b68] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                                3
                            </span>
                        </button>

                        <button
                            type="button"
                            className="relative p-2 rounded-full bg-[#fdf0f4] text-[#4a3c45] hover:text-[#e13b68] hover:bg-[#ffe6ee] transition cursor-pointer"
                            title="Notifications"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#e13b68] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                                6
                            </span>
                        </button>
                    </div>
                )}

                {/* User Avatar & Logout */}
                {user ? (
                    <div className="flex items-center gap-2 pl-2 border-l border-[#f5e4ec]">
                        <div className="w-9 h-9 rounded-full bg-[#ffe6ee] border-2 border-[#f8c8d8] flex items-center justify-center text-xs font-black text-[#e13b68] uppercase shadow-xs">
                            {(userName || 'U').charAt(0)}
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Logout"
                            className="hidden sm:flex p-2 text-xs font-bold text-[#7d6974] hover:text-[#e13b68] hover:bg-[#ffe6ee] rounded-full transition cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
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

                {/* Mobile Menu Button */}
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
