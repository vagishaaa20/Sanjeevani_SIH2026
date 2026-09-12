import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Lock, Mail, Phone, Sparkles } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import CareMascotVisual from '../../components/auth/CareMascotVisual';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';

const DEV_ADMIN_EMAIL = 'admin@sanjeevani.gov.in';
const DEV_ADMIN_PASSWORD = 'admin1234';

export const Login = () => {
    const { login, sendPatientOtp, verifyPatientOtp } = useAuth();
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
        <div className="relative min-h-screen w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,225,235,0.6),rgba(255,252,254,0.95))] text-[#1c1218] overflow-x-hidden flex flex-col justify-between selection:bg-[#fce4ec] selection:text-[#d93864]">
            {/* Ambient Background Glow */}
            <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-[#ffe6ee]/40 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Top Navigation */}
            <header className="w-full max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between z-30">
                <Link
                    to="/"
                    className="flex items-center gap-3 text-lg font-black tracking-tight text-[#1c1218] group"
                >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ffe6ee] to-white border-2 border-[#f5c6d6] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform p-1">
                        <SanjeevaniLogo variant="emblem" size={32} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="font-heading tracking-tight font-black text-xl leading-none">SANJEEVANI</span>
                        <span className="text-[9px] font-bold text-[#e13b68] tracking-widest uppercase mt-0.5">Clinical Platform</span>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-[#7d6974] font-medium hidden sm:inline">New to Sanjeevani?</span>
                    <Link
                        to="/register"
                        className="px-4 py-1.5 rounded-full bg-white border border-[#f5e4ec] hover:border-[#f0d0dc] text-xs font-bold text-[#1c1218] transition shadow-xs"
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
                        <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-[#e13b68] uppercase font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#e13b68]" />
                            Access Portal
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-[#1c1218] tracking-tight font-heading">
                            Welcome back.
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-[#7d6974]">
                            Select your portal to sign in to your Sanjeevani workspace.
                        </p>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 bg-[#faf0f4] border border-[#f5e4ec] rounded-2xl">
                        {[
                            { key: 'patient', label: 'Patient' },
                            { key: 'staff', label: 'Doctor' },
                            { key: 'health_worker', label: 'Worker' },
                            { key: 'clinic', label: 'Clinic' },
                            { key: 'admin', label: 'Admin' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => switchTab(key)}
                                className={`py-2 text-[11px] font-bold rounded-xl cursor-pointer transition-all ${
                                    activeTab === key
                                        ? 'bg-white text-[#e13b68] shadow-xs font-black'
                                        : 'text-[#7d6974] hover:text-[#1c1218]'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                            {error}
                        </div>
                    )}

                    {/* Form Container */}
                    <div className="w-full bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-7 shadow-xs flex flex-col gap-5">

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
                            <button type="button" className="text-xs font-bold text-[#7d6974] hover:text-[#e13b68] text-center cursor-pointer" onClick={() => setOtpSent(false)}>
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
                            <div className="p-4 border border-dashed border-[#f8c8d8] bg-[#ffeff3] rounded-2xl flex flex-col gap-3">
                                <div className="flex items-center gap-1.5 text-[#e13b68]">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-wider">Dev Sandbox</span>
                                </div>
                                <div className="text-xs text-[#4a3c45] font-mono bg-white p-2.5 rounded-xl border border-[#f5e4ec] space-y-0.5">
                                    <p><span className="font-bold">Email:</span> {DEV_ADMIN_EMAIL}</p>
                                    <p><span className="font-bold">Password:</span> {DEV_ADMIN_PASSWORD}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleQuickAdminLogin}
                                    disabled={loading}
                                    className="w-full py-2.5 text-xs font-black bg-[#e13b68] hover:bg-[#c92a55] text-white rounded-full cursor-pointer transition shadow-xs disabled:opacity-50"
                                >
                                    {loading ? 'Logging in…' : '⚡ Quick Login as Administrator'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center pt-2 border-t border-[#f5e4ec]">
                    <p className="text-xs text-[#7d6974] font-semibold">
                        First time using Sanjeevani?{' '}
                        <Link to="/register" className="text-[#e13b68] hover:underline font-bold">
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
            <footer className="w-full max-w-7xl mx-auto px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#9c8491] gap-2 border-t border-[#f7ebf0]">
                <span>© {new Date().getFullYear()} Sanjeevani Clinical Network</span>
                <span className="font-mono">Empathetic Care • Teleconsultation • Records</span>
            </footer>
        </div>
    );
};

export default Login;
