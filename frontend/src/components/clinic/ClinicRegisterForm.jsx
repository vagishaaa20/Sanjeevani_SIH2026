import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import Button from '../common/Button';
import Input from '../common/Input';

export const ClinicRegisterForm = ({ onSuccess }) => {
    const { registerClinic } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        clinicName: '',
        email: '',
        password: '',
        confirmPassword: '',
        licenseNumber: '',
        city: '',
        address: '',
        latitude: '',
        longitude: '',
        departments: [],
    });

    // GPS capture state: 'idle' | 'loading' | 'success' | 'error'
    const [geoStatus, setGeoStatus] = useState('idle');
    const [geoError, setGeoError] = useState('');

    const availableDepartments = ['OPD', 'Diagnostics', 'Lab', 'Pharmacy', 'Emergency'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDeptCheck = (dept) => {
        setFormData((prev) => {
            const depts = prev.departments.includes(dept)
                ? prev.departments.filter((d) => d !== dept)
                : [...prev.departments, dept];
            return { ...prev, departments: depts };
        });
    };

    // ── GPS capture ───────────────────────────────────────────────────────────
    const captureLocation = () => {
        setGeoError('');
        if (!navigator.geolocation) {
            setGeoStatus('error');
            setGeoError('Your browser does not support GPS. Enter coordinates manually.');
            return;
        }
        setGeoStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = parseFloat(pos.coords.latitude.toFixed(6));
                const lng = parseFloat(pos.coords.longitude.toFixed(6));
                setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                setGeoStatus('success');
            },
            (err) => {
                setGeoStatus('error');
                if (err.code === err.PERMISSION_DENIED) {
                    setGeoError('Location permission denied. Please allow access or enter coordinates manually below.');
                } else {
                    setGeoError('Could not determine your location. Please try again or enter coordinates manually.');
                }
            },
            { enableHighAccuracy: true, timeout: 12000 }
        );
    };

    const validateStep = () => {
        setError('');
        if (step === 1) {
            if (!formData.email || !formData.password) {
                setError('Email and password are required');
                return false;
            }
            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters long');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
        } else if (step === 2) {
            if (!formData.clinicName || !formData.licenseNumber || !formData.city) {
                setError('Clinic Name, License Number, and City are required fields');
                return false;
            }
        }
        return true;
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (validateStep()) {
            setStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setError('');
        setStep((prev) => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Require GPS coordinates before submitting — clinic must have a location
        if (!formData.latitude || !formData.longitude) {
            setError("📍 Please capture your clinic's GPS location before submitting. Clinics without GPS coordinates cannot appear in patient nearby-search results.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
            };

            delete payload.confirmPassword; // remove before sending to backend

            await registerClinic(payload);
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // ── GPS status display helper ─────────────────────────────────────────────
    const GpsStatusBadge = () => {
        if (geoStatus === 'idle') return null;

        if (geoStatus === 'loading') {
            return (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold">
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Detecting your GPS location…
                </div>
            );
        }

        if (geoStatus === 'success') {
            return (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold">
                    <span className="text-emerald-500 text-lg">✓</span>
                    <span>
                        Location captured —{' '}
                        <span className="font-mono text-xs">
                            {Math.abs(formData.latitude).toFixed(4)}°{formData.latitude >= 0 ? 'N' : 'S'},{' '}
                            {Math.abs(formData.longitude).toFixed(4)}°{formData.longitude >= 0 ? 'E' : 'W'}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={captureLocation}
                        className="ml-auto text-xs text-emerald-600 underline hover:text-emerald-800 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        // error
        return (
            <div className="flex flex-col gap-1 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <span className="font-semibold">⚠ {geoError}</span>
                <span className="text-xs text-red-600 font-medium">You can enter coordinates manually in the fields below instead.</span>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex justify-between items-center bg-cream-surface p-3 rounded-xl border border-ink-black/20">
                <span className={`text-xs font-bold ${step >= 1 ? 'text-pastel-pink-action' : 'text-ink-muted'}`}>1. Account</span>
                <div className="w-10 h-0.5 bg-ink-black/20"></div>
                <span className={`text-xs font-bold ${step >= 2 ? 'text-pastel-pink-action' : 'text-ink-muted'}`}>2. License Info</span>
                <div className="w-10 h-0.5 bg-ink-black/20"></div>
                <span className={`text-xs font-bold ${step >= 3 ? 'text-pastel-pink-action' : 'text-ink-muted'}`}>3. Location &amp; Depts</span>
            </div>

            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-semibold rounded-xl">
                    {error}
                </div>
            )}

            {step === 1 && (
                <form className="flex flex-col gap-4" onSubmit={handleNext}>
                    <Input
                        label="Email Address"
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="At least 8 characters"
                    />
                    <Input
                        label="Confirm Password"
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <Button type="submit" variant="primary" className="mt-2 w-full">
                        Next: License Info
                    </Button>
                </form>
            )}

            {step === 2 && (
                <form className="flex flex-col gap-4" onSubmit={handleNext}>
                    <Input
                        label="Clinic Name"
                        id="clinicName"
                        name="clinicName"
                        value={formData.clinicName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="License Registration Number"
                        id="licenseNumber"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        required
                        placeholder="e.g. CLINIC-12345"
                    />
                    <Input
                        label="City"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Physical Address"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                    />
                    <div className="flex gap-4 mt-2">
                        <Button type="button" variant="secondary" onClick={handleBack} className="w-1/2">
                            Back
                        </Button>
                        <Button type="submit" variant="primary" className="w-1/2">
                            Next: Location &amp; Services
                        </Button>
                    </div>
                </form>
            )}

            {step === 3 && (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

                    {/* ── GPS auto-capture ─────────────────────────────────── */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                            Clinic GPS Location <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-ink-muted">
                            Patients use your GPS coordinates to find your clinic in nearby-search. Click the button to auto-detect your current location.
                        </p>

                        <button
                            type="button"
                            onClick={captureLocation}
                            disabled={geoStatus === 'loading'}
                            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 font-bold text-sm transition-all duration-150 cursor-pointer
                                ${geoStatus === 'success'
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                    : geoStatus === 'loading'
                                        ? 'border-blue-300 bg-blue-50 text-blue-600 cursor-not-allowed'
                                        : 'border-ink-black bg-white text-ink-black hover:bg-pastel-sky-soft hover:-translate-y-0.5 hover:shadow-sm'
                                }`}
                        >
                            <span className="text-lg">{geoStatus === 'success' ? '✓' : '📍'}</span>
                            {geoStatus === 'loading'
                                ? 'Detecting location…'
                                : geoStatus === 'success'
                                    ? 'Location Captured — Click to Recapture'
                                    : 'Capture My Current Location'}
                        </button>

                        <GpsStatusBadge />
                    </div>

                    {/* ── Manual fallback inputs (shown after capture attempt or on success for review) ── */}
                    {(geoStatus === 'error' || geoStatus === 'success') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                                    Latitude {geoStatus === 'success' && <span className="normal-case font-normal text-ink-muted">(auto-filled)</span>}
                                </label>
                                <input
                                    type="number"
                                    name="latitude"
                                    step="any"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 22.8046"
                                    className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                                    Longitude {geoStatus === 'success' && <span className="normal-case font-normal text-ink-muted">(auto-filled)</span>}
                                </label>
                                <input
                                    type="number"
                                    name="longitude"
                                    step="any"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 86.2029"
                                    className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Departments ───────────────────────────────────────── */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                            Departments / Services
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-3 bg-cream-surface border border-ink-black/20 rounded-xl">
                            {availableDepartments.map((dept) => (
                                <label key={dept} className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-ink-black select-none">
                                    <input
                                        type="checkbox"
                                        checked={formData.departments.includes(dept)}
                                        onChange={() => handleDeptCheck(dept)}
                                        className="accent-pastel-pink-action w-4 h-4 cursor-pointer"
                                    />
                                    {dept}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                        <Button type="button" variant="secondary" onClick={handleBack} className="w-1/2">
                            Back
                        </Button>
                        <Button type="submit" variant="primary" className="w-1/2" disabled={loading}>
                            {loading ? 'Submitting...' : 'Register Clinic'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ClinicRegisterForm;
