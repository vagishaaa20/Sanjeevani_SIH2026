import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ClinicRegisterForm from '../../components/clinic/ClinicRegisterForm';
import clinicService from '../../services/clinicService';

export const Register = () => {
    const { registerPatient, registerDoctor } = useAuth();
    const navigate = useNavigate();
    const [role, setRole] = useState(null); // 'patient', 'doctor', 'clinic'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Patient registration states
    const [patientData, setPatientData] = useState({
        phone: '',
        fullName: '',
        dateOfBirth: '',
        sex: 'male',
        preferredLanguage: '',
        region: '',
        abhaNumber: '',
    });

    // Patient validation / OTP verification trigger
    const [otpVerifyNeeded, setOtpVerifyNeeded] = useState(false);
    const [otpUserId, setOtpUserId] = useState('');
    const [devOtp, setDevOtp] = useState('');

    // Doctor registration states
    const [doctorStep, setDoctorStep] = useState(1);
    const [doctorData, setDoctorData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        specialization: '',
        medicalRegistrationNumber: '',
        stateMedicalCouncil: '',
        primaryMedicalQualification: '',
        medicalCollege: '',
        graduationYear: '',
        consultationFee: '',
        clinicOrHospital: '',
        clinicId: '',
    });
    const [allClinics, setAllClinics] = useState([]);
    const [clinicOptions, setClinicOptions] = useState([]);
    const [clinicSearch, setClinicSearch] = useState('');
    const [clinicsLoading, setClinicsLoading] = useState(false);
    const [medCertFile, setMedCertFile] = useState(null);
    const [qualificationFile, setQualificationFile] = useState(null);

    const handlePatientChange = (e) => {
        const { name, value } = e.target;
        setPatientData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDoctorChange = (e) => {
        const { name, value } = e.target;
        setDoctorData((prev) => ({ ...prev, [name]: value }));
    };

    // Fetch clinics once when doctor role is selected
    useEffect(() => {
        if (role === 'doctor') {
            setClinicsLoading(true);
            clinicService.getAllClinics()
                .then((data) => {
                    setAllClinics(data.clinics || []);
                    setClinicOptions(data.clinics || []);
                })
                .catch((err) => console.error('Failed to load clinics', err))
                .finally(() => setClinicsLoading(false));
        }
    }, [role]);

    // Filter clinics locally when search text changes
    useEffect(() => {
        if (clinicSearch.trim() === '') {
            setClinicOptions(allClinics);
        } else {
            const lowerSearch = clinicSearch.toLowerCase();
            setClinicOptions(
                allClinics.filter(
                    (c) =>
                        c.clinicName.toLowerCase().includes(lowerSearch) ||
                        c.city.toLowerCase().includes(lowerSearch)
                )
            );
        }
    }, [clinicSearch, allClinics]);

    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await registerPatient(patientData);
            setOtpUserId(data.user.id);
            setOtpVerifyNeeded(true);
            if (data.devOtp) {
                setDevOtp(data.devOtp);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Patient registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDoctorSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (doctorStep === 1) {
            // Validate Step 1
            if (!doctorData.fullName || !doctorData.email || !doctorData.password || !doctorData.city) {
                setError('Please fill all required fields');
                return;
            }
            if (doctorData.password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }
            setDoctorStep(2);
            return;
        }

        if (doctorStep === 2) {
            // Validate Step 2
            if (!doctorData.specialization || !doctorData.medicalRegistrationNumber) {
                setError('Specialization and Medical Registration Number are required');
                return;
            }
            setDoctorStep(3);
            return;
        }

        // Step 3 submission
        if (!medCertFile || !qualificationFile) {
            setError('Please upload both required verification documents');
            return;
        }

        setLoading(true);
        try {
            const dataToSubmit = {
                ...doctorData,
                medicalRegistrationCertificate: medCertFile,
                mbbsOrPrimaryQualification: qualificationFile
            };

            await registerDoctor(dataToSubmit);
            alert('Registration with documents successful! Note: Your profile is now under admin verification. You can log in using your credentials, but you will only see your verification review status until approved.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleClinicSuccess = () => {
        alert('Clinic registration successful! Your application is pending verification by an administrator. You can now use your email and password to log in.');
        navigate('/login');
    };

    return (
        <div className="w-full flex-grow flex items-center justify-center p-6 bg-cream-bg">
            <div className="w-full max-w-xl p-8 bg-white border-2 border-ink-black rounded-3xl shadow-md flex flex-col gap-6 animate-fade-in-up">

                {/* Step 1: Select Role */}
                {!role && (
                    <div className="flex flex-col gap-6 text-center">
                        <div>
                            <h2 className="text-3xl font-black text-ink-black">Create Account</h2>
                            <p className="text-sm font-semibold text-ink-charcoal mt-1">Select your profile type to register</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setRole('patient')}
                                className="p-6 bg-cream-surface border-2 border-ink-black rounded-2xl flex flex-col items-center gap-2 hover:-translate-y-1 hover:bg-pastel-sky-soft hover:shadow cursor-pointer transition duration-200"
                            >
                                <span className="w-12 h-12 rounded-full bg-pastel-sky flex items-center justify-center text-xl font-bold border border-ink-black">👤</span>
                                <span className="font-bold text-ink-black">Patient Care</span>
                                <span className="text-xs text-ink-muted">Register health card via OTP</span>
                            </button>

                            <button
                                onClick={() => setRole('doctor')}
                                className="p-6 bg-cream-surface border-2 border-ink-black rounded-2xl flex flex-col items-center gap-2 hover:-translate-y-1 hover:bg-pastel-pink-soft hover:shadow cursor-pointer transition duration-200"
                            >
                                <span className="w-12 h-12 rounded-full bg-pastel-pink flex items-center justify-center text-xl font-bold border border-ink-black">🩺</span>
                                <span className="font-bold text-ink-black">Doctor Profile</span>
                                <span className="text-xs text-ink-muted">Onboard verified practitioner</span>
                            </button>

                            <button
                                onClick={() => setRole('clinic')}
                                className="p-6 bg-cream-surface border-2 border-ink-black rounded-2xl flex flex-col items-center gap-2 hover:-translate-y-1 hover:bg-icy-mint-soft hover:shadow cursor-pointer transition duration-200"
                            >
                                <span className="w-12 h-12 rounded-full bg-icy-mint flex items-center justify-center text-xl font-bold border border-ink-black">🏥</span>
                                <span className="font-bold text-ink-black">Clinic / Lab</span>
                                <span className="text-xs text-ink-muted">Onboard hospital & department</span>
                            </button>
                        </div>

                        <div className="pt-4 border-t border-cream-surface text-center">
                            <p className="text-xs font-semibold text-ink-charcoal">
                                Already registered?{' '}
                                <Link to="/login" className="text-pastel-pink-action hover:underline font-bold">Log In</Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* Selected Role Form container */}
                {role && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-3 border-b border-cream-surface">
                            <button
                                onClick={() => {
                                    setRole(null);
                                    setError('');
                                    setOtpVerifyNeeded(false);
                                }}
                                className="text-xs font-bold text-ink-muted hover:text-ink-black cursor-pointer"
                            >
                                ← Change Role
                            </button>
                            <span className="text-xs font-bold uppercase tracking-wider text-ink-charcoal">
                                {role} registration
                            </span>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-sm font-semibold rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Patient Registration Flow */}
                        {role === 'patient' && (
                            !otpVerifyNeeded ? (
                                <form className="flex flex-col gap-4" onSubmit={handlePatientSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Full Name"
                                            id="fullName"
                                            name="fullName"
                                            value={patientData.fullName}
                                            onChange={handlePatientChange}
                                            required
                                        />
                                        <Input
                                            label="Phone Number"
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={patientData.phone}
                                            onChange={handlePatientChange}
                                            required
                                            placeholder="e.g. 9876543210"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Date of Birth"
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            type="date"
                                            value={patientData.dateOfBirth}
                                            onChange={handlePatientChange}
                                            required
                                        />
                                        <div className="flex flex-col gap-1 w-full text-left">
                                            <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">Sex</label>
                                            <select
                                                name="sex"
                                                value={patientData.sex}
                                                onChange={handlePatientChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve"
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Preferred Language"
                                            id="preferredLanguage"
                                            name="preferredLanguage"
                                            value={patientData.preferredLanguage}
                                            onChange={handlePatientChange}
                                            placeholder="e.g. Hindi, English"
                                        />
                                        <Input
                                            label="Region / State"
                                            id="region"
                                            name="region"
                                            value={patientData.region}
                                            onChange={handlePatientChange}
                                            placeholder="e.g. Jamshedpur, Jharkhand"
                                        />
                                    </div>
                                    <Input
                                        label="ABHA Health ID Number"
                                        id="abhaNumber"
                                        name="abhaNumber"
                                        value={patientData.abhaNumber}
                                        onChange={handlePatientChange}
                                        placeholder="e.g. 14-digit ABHA ID"
                                    />
                                    <Button type="submit" variant="primary" className="mt-2 w-full" disabled={loading}>
                                        {loading ? 'Registering...' : 'Register Profile'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="flex flex-col gap-4 text-center">
                                    <h3 className="text-xl font-bold text-ink-black">Confirm Registration</h3>
                                    <p className="text-sm text-ink-charcoal">
                                        Registration request successful! A code has been dispatched. Log in via your phone number from the Sign In page to verify and start operations.
                                    </p>
                                    {devOtp && (
                                        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-bold rounded-lg mt-2">
                                            [Development OTP]: {devOtp}
                                        </div>
                                    )}
                                    <Link to="/login" className="w-full">
                                        <Button variant="primary" className="w-full">Go to Sign In</Button>
                                    </Link>
                                </div>
                            )
                        )}

                        {/* Doctor Registration Flow */}
                        {role === 'doctor' && (
                            <form className="flex flex-col gap-4 text-left" onSubmit={handleDoctorSubmit}>
                                {/* Progress Indicator */}
                                <div className="flex items-center justify-between pb-2 border-b border-cream-surface mb-2">
                                    <span className="text-xs font-bold text-ink-muted">
                                        Step {doctorStep} of 3
                                    </span>
                                    <span className="text-xs font-bold text-pastel-pink-action">
                                        {doctorStep === 1 && 'Credentials & Location'}
                                        {doctorStep === 2 && 'Professional Information'}
                                        {doctorStep === 3 && 'Document Upload'}
                                    </span>
                                </div>

                                {/* Step 1: Account details */}
                                {doctorStep === 1 && (
                                    <div className="flex flex-col gap-4">
                                        <Input
                                            label="Full Name"
                                            id="fullName"
                                            name="fullName"
                                            value={doctorData.fullName}
                                            onChange={handleDoctorChange}
                                            required
                                            placeholder="Dr. John Doe"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Email Address"
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={doctorData.email}
                                                onChange={handleDoctorChange}
                                                required
                                            />
                                            <Input
                                                label="Phone Number"
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={doctorData.phone}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. 9876543210"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Password"
                                                id="password"
                                                name="password"
                                                type="password"
                                                value={doctorData.password}
                                                onChange={handleDoctorChange}
                                                required
                                                placeholder="Minimum 8 characters"
                                            />
                                            <Input
                                                label="City / Location"
                                                id="city"
                                                name="city"
                                                value={doctorData.city}
                                                onChange={handleDoctorChange}
                                                required
                                                placeholder="e.g. Jamshedpur"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Professional Profile details */}
                                {doctorStep === 2 && (
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Specialization"
                                                id="specialization"
                                                name="specialization"
                                                value={doctorData.specialization}
                                                onChange={handleDoctorChange}
                                                required
                                                placeholder="e.g. Cardiologist"
                                            />
                                            <Input
                                                label="Medical Registration Number"
                                                id="medicalRegistrationNumber"
                                                name="medicalRegistrationNumber"
                                                value={doctorData.medicalRegistrationNumber}
                                                onChange={handleDoctorChange}
                                                required
                                                placeholder="e.g. Registration No."
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="State Medical Council"
                                                id="stateMedicalCouncil"
                                                name="stateMedicalCouncil"
                                                value={doctorData.stateMedicalCouncil}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. Jharkhand Medical Council"
                                            />
                                            <Input
                                                label="Primary Medical Qualification"
                                                id="primaryMedicalQualification"
                                                name="primaryMedicalQualification"
                                                value={doctorData.primaryMedicalQualification}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. MBBS, MD"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Medical College / University"
                                                id="medicalCollege"
                                                name="medicalCollege"
                                                value={doctorData.medicalCollege}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. AIIMS"
                                            />
                                            <Input
                                                label="Graduation Year"
                                                id="graduationYear"
                                                name="graduationYear"
                                                value={doctorData.graduationYear}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. 2018"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Consultation Fee (INR)"
                                                id="consultationFee"
                                                name="consultationFee"
                                                type="number"
                                                value={doctorData.consultationFee}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. 500"
                                            />
                                            <Input
                                                label="Clinic / Hospital Name"
                                                id="clinicOrHospital"
                                                name="clinicOrHospital"
                                                value={doctorData.clinicOrHospital}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. Sanjeevani Clinic"
                                            />
                                        </div>

                                        {/* New: optional link to a registered clinic in the system */}
                                        <div className="flex flex-col gap-1 w-full text-left">
                                            <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">
                                                Link to Registered Clinic <span className="normal-case font-normal text-ink-muted">(optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Search registered clinics..."
                                                value={clinicSearch}
                                                onChange={(e) => setClinicSearch(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve text-sm mb-1"
                                            />
                                            <select
                                                name="clinicId"
                                                value={doctorData.clinicId}
                                                onChange={handleDoctorChange}
                                                disabled={clinicsLoading}
                                                className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve"
                                            >
                                                <option value="">— Not linked to a registered clinic —</option>
                                                {clinicOptions.map((clinic) => (
                                                    <option key={clinic.userId} value={clinic.userId}>
                                                        {clinic.clinicName} ({clinic.city})
                                                    </option>
                                                ))}
                                            </select>
                                            {clinicsLoading && (
                                                <span className="text-xs text-ink-muted">Loading clinics…</span>
                                            )}
                                            <p className="text-xs text-ink-muted mt-1">
                                                If your clinic is already registered on Sanjeevani, link it here so patients can find you in nearby-doctor searches. Otherwise, leave blank.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Document Attachments */}
                                {doctorStep === 3 && (
                                    <div className="flex flex-col gap-4">
                                        <div className="mb-2">
                                            <p className="text-xs text-ink-charcoal font-semibold">
                                                Please upload high-quality scans of your documents (PDF, JPG, PNG). Max 10MB per file:
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="border border-zinc-350 p-4 rounded-xl flex flex-col gap-2 bg-cream-surface/30">
                                                <label className="text-xs font-bold text-ink-black uppercase tracking-wider block">
                                                    1. Medical Registration Certificate *
                                                </label>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    required
                                                    onChange={(e) => setMedCertFile(e.target.files[0])}
                                                    className="w-full text-xs"
                                                />
                                                {medCertFile && (
                                                    <span className="text-xs text-emerald-700 font-bold block mt-1">
                                                        ✓ Selected: {medCertFile.name} ({(medCertFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </span>
                                                )}
                                            </div>

                                            <div className="border border-zinc-350 p-4 rounded-xl flex flex-col gap-2 bg-cream-surface/30">
                                                <label className="text-xs font-bold text-ink-black uppercase tracking-wider block">
                                                    2. MBBS or Primary Qualification Proof *
                                                </label>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    required
                                                    onChange={(e) => setQualificationFile(e.target.files[0])}
                                                    className="w-full text-xs"
                                                />
                                                {qualificationFile && (
                                                    <span className="text-xs text-emerald-700 font-bold block mt-1">
                                                        ✓ Selected: {qualificationFile.name} ({(qualificationFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between gap-4 mt-2">
                                    {doctorStep > 1 && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setDoctorStep((prev) => prev - 1)}
                                            disabled={loading}
                                            className="px-6"
                                        >
                                            Back
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-grow justify-center"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? 'Registering...'
                                            : doctorStep === 3
                                                ? 'Register Profile & Send for Review'
                                                : 'Next Step →'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Clinic Registration Wizard */}
                        {role === 'clinic' && (
                            <ClinicRegisterForm onSuccess={handleClinicSuccess} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;