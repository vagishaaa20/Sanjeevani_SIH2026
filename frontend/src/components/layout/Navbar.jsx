import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b-2 border-ink-black py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <Link to="/" className="text-2xl font-black tracking-tight text-ink-black hover:opacity-85 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-pastel-pink-action border-2 border-ink-black inline-block"></span>
                    Sanjeevani
                </Link>
                {user && (
                    <span className="hidden sm:inline-block px-3 py-1 text-xs font-semibold uppercase bg-cream-surface border border-ink-black rounded-lg">
                        {user.role} desk
                    </span>
                )}
            </div>

            <div className="flex items-center gap-6">
                {user ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-ink-charcoal">
                            Hi, {user.email || user.phone}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-1.5 text-xs font-bold text-ink-black bg-cream-surface border border-ink-black rounded-full hover:bg-ink-black hover:text-white transition duration-200 cursor-pointer"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="text-sm font-bold text-ink-black hover:underline"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-1.5 text-sm font-bold fg-white bg-pastel-pink-action border border-ink-black rounded-full hover:bg-pastel-pink-action-hover shadow-sm transition duration-200 text-white"
                        >
                            Register
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
