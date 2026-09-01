import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

    // Active tab: 'patient', 'staff', 'admin'
    const [activeTab, setActiveTab] = useState('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // States for OTP flow (Patient)
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

    // Quick login uses hardcoded dev credentials - login() manages its own loading state
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
    const isAdminTab = activeTab === 'admin';
    const isDev = import.meta.env.DEV;

    return (
        <div className="w-full flex-grow flex items-center justify-center p-6 bg-cream-bg">
            <div className="w-full max-w-xl p-8 bg-white border-2 border-ink-black rounded-3xl shadow-md flex flex-col gap-6">
                <div className="text-center flex flex-col gap-1">
                    <h2 className="text-3xl font-black tracking-tight text-ink-black">Welcome Back</h2>
                    <p className="text-sm font-semibold text-ink-charcoal">Access your Sanjeevani health desk</p>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 p-1 bg-cream-surface border border-ink-black rounded-xl gap-1">
                    {[
                        { key: 'patient', label: 'Patient Care' },
                        { key: 'staff', label: 'Staff / Dr.' },
                        { key: 'admin', label: 'Admin HQ' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => switchTab(key)}
                            className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${activeTab === key
                                    ? 'bg-white border border-ink-black text-ink-black shadow-sm'
                                    : 'text-ink-muted hover:text-ink-charcoal'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-sm font-semibold rounded-xl">
                        {error}
                    </div>
                )}

                {/* ─── Patient OTP ─── */}
                {isPatientTab && (
                    !otpSent ? (
                        <form className="flex flex-col gap-4" onSubmit={handleSendOtp}>
                            <Input
                                label="Registered Mobile Number"
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                placeholder="e.g. 9876543210"
                            />
                            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                {loading ? 'Sending…' : 'Send OTP'}
                            </Button>
                        </form>
                    ) : (
                        <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
                            {devOtpMsg && (
                                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-lg">
                                    {devOtpMsg}
                                </div>
                            )}
                            <Input
                                label="One-Time Password"
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                placeholder="123456"
                            />
                            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                {loading ? 'Verifying…' : 'Verify & Login'}
                            </Button>
                            <button type="button" className="text-xs font-bold text-ink-muted hover:text-ink-black text-center cursor-pointer" onClick={() => setOtpSent(false)}>
                                ← Back to Mobile input
                            </button>
                        </form>
                    )
                )}

                {/* ─── Staff / Doctor ─── */}
                {isStaffTab && (
                    <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
                        <Input
                            label="Email Address"
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="doctor@sanjeevani.in"
                        />
                        <Input
                            label="Password"
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                            {loading ? 'Signing In…' : 'Sign In'}
                        </Button>
                    </form>
                )}

                {/* ─── Administrator ─── */}
                {isAdminTab && (
                    <div className="flex flex-col gap-4">
                        <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
                            <Input
                                label="Admin Email"
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@sanjeevani.gov.in"
                            />
                            <Input
                                label="Password"
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                {loading ? 'Signing In…' : 'Sign In as Admin'}
                            </Button>
                        </form>

                        {/* Dev-only quick login */}
                        {isDev && (
                            <div className="p-4 border border-dashed border-amber-300 bg-amber-50 rounded-2xl flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">⚠ Dev Sandbox</span>
                                </div>
                                <div className="text-xs text-amber-800 font-mono bg-amber-100 px-3 py-2 rounded-lg space-y-0.5">
                                    <p><span className="font-bold">Email:</span> {DEV_ADMIN_EMAIL}</p>
                                    <p><span className="font-bold">Password:</span> {DEV_ADMIN_PASSWORD}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleQuickAdminLogin}
                                    disabled={loading}
                                    className="w-full py-2.5 text-sm font-bold bg-amber-400 hover:bg-amber-500 border border-amber-600 text-amber-900 rounded-xl cursor-pointer transition disabled:opacity-50"
                                >
                                    {loading ? 'Logging in…' : '⚡ Quick Login as Administrator'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center pt-2 border-t border-cream-surface">
                    <p className="text-xs text-ink-charcoal font-semibold">
                        First time using Sanjeevani?{' '}
                        <Link to="/register" className="text-pastel-pink-action hover:underline font-bold">
                            Create an Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
