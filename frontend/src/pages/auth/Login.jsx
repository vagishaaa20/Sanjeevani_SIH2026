import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Lock, Mail, Phone, Sparkles, User, Stethoscope, HeartPulse, Building2, Shield, Sun, Moon } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import CareMascotVisual from '../../components/auth/CareMascotVisual';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';

const DEV_ADMIN_EMAIL = 'admin@sanjeevani.gov.in';
const DEV_ADMIN_PASSWORD = 'admin1234';

export const Login = () => {
    const { login, sendPatientOtp, verifyPatientOtp } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpUserId, setOtpUserId] = useState('');
    const [devOtpMsg, setDevOtpMsg] = useState('');

    const redirectUser = (role) => {
        if (role === 'admin') {
            navigate('/admin/clinics');
        } else if (role === 'clinic_admin') {
            navigate('/clinic/profile');
        } else if (role === 'doctor') {
            navigate('/doctor/dashboard');
        } else if (role === 'patient') {
            navigate('/patient/dashboard');
        } else if (role === 'health_worker') {
            navigate('/health-worker/dashboard');
        } else {
            navigate('/');
        }
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login({ email, password });
            redirectUser(user.role);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdminLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const user = await login({ email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD });
            redirectUser(user.role);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                `Quick Login failed. Run: node backend/src/utils/seedAdmin.js`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await sendPatientOtp(phone);
            setOtpUserId(data.userId);
            setOtpSent(true);
            if (data.devOtp) {
                setDevOtpMsg(`[DEV] OTP is: ${data.devOtp}`);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. Make sure the phone is registered.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await verifyPatientOtp(otpUserId, otp);
            redirectUser(user.role);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        setError('');
        setEmail('');
        setPassword('');
    };

    const isPatientTab = activeTab === 'patient';
    const isStaffTab = activeTab === 'staff';
    const isClinicTab = activeTab === 'clinic';
    const isAdminTab = activeTab === 'admin';
    const isHealthWorkerTab = activeTab === 'health_worker';
    const isDev = import.meta.env.DEV;

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* Ambient Background Glow */}
            <div className="fixed top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none -z-10" style={{ background: 'var(--accent-light)', opacity: 0.3 }} />

            {/* Top Navigation */}
            <header className="w-full max-w-7xl mx-auto px-6 md:px-12 py-2 md:py-3 flex items-center justify-between z-30">
                <Link
                    to="/"
                    className="flex items-center gap-3 text-lg font-black tracking-tight group"
                    style={{ color: 'var(--text-primary)' }}
                >
                    <div className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform p-1" style={{ background: 'var(--logo-gradient)', borderColor: 'var(--border)' }}>
                        <SanjeevaniLogo variant="emblem" size={32} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="font-heading tracking-tight font-black text-xl leading-none">SANJEEVANI</span>
                        <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5" style={{ color: 'var(--accent)' }}>Clinical Platform</span>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
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
                    <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>New to Sanjeevani?</span>
                    <Link
                        to="/register"
                        className="px-4 py-1.5 rounded-full text-xs font-bold transition shadow-xs"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        Register
                    </Link>
                </div>
            </header>

            {/* Main Composition: Auth LEFT (5 cols) + Mascot RIGHT (7 cols) */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6 md:py-10 z-20">
                {/* Left Column: Authentication Panel (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6 max-w-md w-full mx-auto lg:mx-0">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: 'var(--accent)' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                            Access Portal
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-heading" style={{ color: 'var(--text-primary)' }}>
                            Welcome back.
                        </h1>
                        <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Select your portal to sign in to your Sanjeevani workspace.
                        </p>
                    </div>

                    {/* Minimalist Role Selector Tabs with Micro-Avatars */}
                    <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-[#faf0f4] border border-[#f5e4ec] rounded-2xl">
                        {[
                            { key: 'patient', label: 'Patient', icon: User },
                            { key: 'staff', label: 'Doctor', icon: Stethoscope },
                            { key: 'health_worker', label: 'Worker', icon: HeartPulse },
                            { key: 'clinic', label: 'Clinic', icon: Building2 },
                            { key: 'admin', label: 'Admin', icon: Shield },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => switchTab(key)}
                                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all ${activeTab === key
                                    ? 'shadow-xs font-black border border-[var(--border)]'
                                    : 'border border-transparent hover:opacity-80'
                                    }`}
                                style={{
                                    background: activeTab === key ? 'var(--card-bg)' : 'transparent',
                                    color: activeTab === key ? 'var(--accent)' : 'var(--text-secondary)'
                                }}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${activeTab === key
                                    ? 'shadow-2xs'
                                    : 'opacity-70'
                                    }`}
                                    style={{
                                        background: activeTab === key ? 'var(--logo-gradient)' : 'var(--bg-surface)',
                                        color: activeTab === key ? 'var(--accent)' : 'var(--text-secondary)'
                                    }}>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="p-3 text-xs font-bold rounded-2xl" style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                            {error}
                        </div>
                    )}

                    {/* Form Container */}
                    <div className="w-full rounded-3xl p-6 md:p-7 shadow-xs flex flex-col gap-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>

                        {/* Patient OTP */}
                        {isPatientTab && (
                            !otpSent ? (
                                <form className="flex flex-col gap-4" onSubmit={handleSendOtp}>
                                    <Input
                                        label="Registered Mobile Number"
                                        id="phone"
                                        type="tel"
                                        icon={Phone}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        placeholder="e.g. 8888888888"
                                    />
                                    <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                        {loading ? 'Sending…' : 'Send OTP'}
                                    </Button>
                                </form>
                            ) : (
                                <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
                                    {devOtpMsg && (
                                        <div className="p-2.5 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold rounded-xl">
                                            {devOtpMsg}
                                        </div>
                                    )}
                                    <Input
                                        label="One-Time Password"
                                        id="otp"
                                        type="text"
                                        icon={Lock}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        placeholder="123456"
                                    />
                                    <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                        {loading ? 'Verifying…' : 'Verify & Login'}
                                    </Button>
                                    <button type="button" className="text-xs font-bold text-center cursor-pointer" style={{ color: 'var(--text-secondary)' }} onClick={() => setOtpSent(false)}>
                                        ← Back to Mobile input
                                    </button>
                                </form>
                            )
                        )}

                        {/* Doctor Staff */}
                        {isStaffTab && (
                            <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
                                <Input
                                    label="Doctor Email Address"
                                    id="email"
                                    type="email"
                                    icon={Mail}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="testdoctor@gmail.com"
                                />
                                <Input
                                    label="Password"
                                    id="password"
                                    type="password"
                                    icon={Lock}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                    {loading ? 'Signing In…' : 'Sign In as Doctor'}
                                </Button>
                            </form>
                        )}

                        {/* Clinic Admin */}
                        {isClinicTab && (
                            <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
                                <Input
                                    label="Clinic Manager Email"
                                    id="email"
                                    type="email"
                                    icon={Mail}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="contact@sanjeevaniclinic.in"
                                />
                                <Input
                                    label="Password"
                                    id="password"
                                    type="password"
                                    icon={Lock}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                    {loading ? 'Signing In…' : 'Access Clinic Portal'}
                                </Button>
                            </form>
                        )}

                        {/* Health Worker */}
                        {isHealthWorkerTab && (
                            <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
                                <Input
                                    label="Health Worker Email"
                                    id="health-worker-email"
                                    type="email"
                                    icon={Mail}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="worker@sanjeevani.gov.in"
                                />
                                <Input
                                    label="Password"
                                    id="health-worker-password"
                                    type="password"
                                    icon={Lock}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                    {loading ? 'Signing In…' : 'Sign In as Health Worker'}
                                </Button>
                            </form>
                        )}

                        {/* Administrator */}
                        {isAdminTab && (
                            <div className="flex flex-col gap-4">
                                <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
                                    <Input
                                        label="Admin Email"
                                        id="email"
                                        type="email"
                                        icon={Mail}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="admin@sanjeevani.gov.in"
                                    />
                                    <Input
                                        label="Password"
                                        id="password"
                                        type="password"
                                        icon={Lock}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                        {loading ? 'Signing In…' : 'Sign In as Admin'}
                                    </Button>
                                </form>

                                {/* Dev Sandbox Quick Login */}
                                {isDev && (
                                    <div className="p-4 border border-dashed rounded-2xl flex flex-col gap-3" style={{ background: 'var(--accent-light)', borderColor: 'var(--notif-unread-border)' }}>
                                        <div className="flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                                            <Sparkles className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-wider">Dev Sandbox</span>
                                        </div>
                                        <div className="text-xs font-mono p-2.5 rounded-xl space-y-0.5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                            <p><span className="font-bold">Email:</span> {DEV_ADMIN_EMAIL}</p>
                                            <p><span className="font-bold">Password:</span> {DEV_ADMIN_PASSWORD}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleQuickAdminLogin}
                                            disabled={loading}
                                            className="w-full py-2.5 text-xs font-black text-white rounded-full cursor-pointer transition shadow-xs disabled:opacity-50"
                                            style={{ background: 'var(--accent)' }}
                                        >
                                            {loading ? 'Logging in…' : '⚡ Quick Login as Administrator'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-center pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                First time using Sanjeevani?{' '}
                                <Link to="/register" className="font-bold" style={{ color: 'var(--accent)' }}>
                                    Create an Account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Static Minimalist Care Mascot (7 cols) */}
                <div className="lg:col-span-7 hidden lg:flex items-center justify-center p-4">
                    <CareMascotVisual />
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full max-w-7xl mx-auto px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <span>© {new Date().getFullYear()} Sanjeevani Clinical Network</span>
                <span className="font-mono">Empathetic Care • Teleconsultation • Records</span>
            </footer>
        </div>
    );
};

export default Login;
