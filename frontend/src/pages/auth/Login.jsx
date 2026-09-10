import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Lock, Mail, Phone, Sparkles } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

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
        <div className="w-full max-w-md mx-auto py-8 px-4 flex flex-col items-center animate-fade-in-up">
            {/* Header Brand */}
            <div className="flex flex-col items-center gap-2 mb-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68] shadow-xs">
                    <Heart className="w-6 h-6 fill-[#e13b68]" />
                </div>
                <h1 className="text-3xl font-black text-[#2d2329] tracking-tight font-heading">
                    Sanjeevani
                </h1>
                <p className="text-xs font-semibold text-[#7d6974]">
                    AI-Assisted Telemedicine & Care Infrastructure
                </p>
            </div>

            {/* Login Card Container */}
            <div className="w-full bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 text-left">
                {/* Role Tabs */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1.5 bg-[#fdf0f4] border border-[#f5e4ec] rounded-2xl">
                    {[
                        { key: 'patient', label: 'Patient' },
                        { key: 'staff', label: 'Doctor' },
                        { key: 'health_worker', label: 'Health Worker' },
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
                                    : 'text-[#7d6974] hover:text-[#2d2329]'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                        {error}
                    </div>
                )}

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
    );
};

export default Login;
