import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ClinicRegisterForm from '../../components/clinic/ClinicRegisterForm';
import clinicService from '../../services/clinicService';
import healthWorkerAdminService from '../../services/healthWorkerAdminService';
import CareMascotVisual from '../../components/auth/CareMascotVisual';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';

export const INDIAN_MEDICAL_SPECIALIZATIONS = [
    'General Medicine / Internal Medicine',
    'General Surgery',
    'Obstetrics & Gynaecology (OB-GYN)',
    'Pediatrics & Neonatology',
    'Cardiology & Interventional Cardiology',
    'Dermatology, Venereology & Leprosy (DVL)',
    'Orthopaedics & Joint Replacement',
    'Neurology',
    'Neurosurgery',
    'Ophthalmology (Eye Specialist)',
    'ENT (Otorhinolaryngology / Head & Neck)',
    'Psychiatry & Behavioral Health',
    'Pulmonology / Respiratory Medicine',
    'Gastroenterology & Hepatology',
    'Endocrinology & Diabetology',
    'Nephrology & Renal Medicine',
    'Medical Oncology & Chemotherapy',
    'Surgical Oncology',
    'Urology & Uro-Surgery',
    'Emergency Medicine & Trauma Care',
    'Anaesthesiology & Critical Care',
    'Radiology & Radio-Diagnosis',
    'Pathology & Laboratory Medicine',
    'Community Medicine & Family Medicine',
    'Infectious Diseases',
    'Rheumatology & Clinical Immunology',
    'Physical Medicine & Rehabilitation (PMR)',
    'Plastic & Reconstructive Surgery',
    'Pediatric Surgery',
    'Cardiothoracic & Vascular Surgery (CTVS)',
    'Dental Surgery (BDS / MDS)',
    'Ayurveda (BAMS / MD Ayurveda)',
    'Homeopathy (BHMS / MD Homeopathy)',
    'Unani Medicine (BUMS)',
    'Siddha Medicine (BSMS)',
    'Other NMC Registered Specialization',
];

export const Register = () => {
    const { registerPatient, registerDoctor, registerHealthWorker } = useAuth();
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
        districtId: '',
        villageId: '',
        areaId: '',
        abhaNumber: '',
    });

    // Patient validation / OTP verification trigger
    const [otpVerifyNeeded, setOtpVerifyNeeded] = useState(false);
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
        clinicId: '',
    });
    const [selectedSpecializations, setSelectedSpecializations] = useState([]);
    const [allClinics, setAllClinics] = useState([]);
    const [clinicOptions, setClinicOptions] = useState([]);
    const [clinicSearch, setClinicSearch] = useState('');
    const [clinicsLoading, setClinicsLoading] = useState(false);
    const [medCertFile, setMedCertFile] = useState(null);
    const [qualificationFile, setQualificationFile] = useState(null);
    const [geoOptions, setGeoOptions] = useState({ districts: [], villages: [], areas: [] });
    const [workerGeoOptions, setWorkerGeoOptions] = useState({ states: [], districts: [], areas: [] });

    const [healthWorkerData, setHealthWorkerData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        area: '',
        district: '',
        stateId: '',
        districtId: '',
        areaId: '',
        workerType: 'COMMUNITY_WORKER',
    });

    const handlePatientChange = (e) => {
        const { name, value } = e.target;
        setPatientData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDoctorChange = (e) => {
        const { name, value } = e.target;
        setDoctorData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddSpecialization = (specToAdd) => {
        if (!specToAdd) return;
        if (!selectedSpecializations.includes(specToAdd)) {
            const updated = [...selectedSpecializations, specToAdd];
            setSelectedSpecializations(updated);
            setDoctorData((prev) => ({ ...prev, specialization: updated.join(', ') }));
        }
    };

    const handleRemoveSpecialization = (specToRemove) => {
        const updated = selectedSpecializations.filter((s) => s !== specToRemove);
        setSelectedSpecializations(updated);
        setDoctorData((prev) => ({ ...prev, specialization: updated.join(', ') }));
    };

    // Load registered clinics when doctor role is active
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

    // Filter clinics when search input changes
    useEffect(() => {
        if (!clinicSearch.trim()) {
            setClinicOptions(allClinics);
        } else {
            const lower = clinicSearch.toLowerCase();
            setClinicOptions(
                allClinics.filter(
                    (c) =>
                        (c.clinicName && c.clinicName.toLowerCase().includes(lower)) ||
                        (c.name && c.name.toLowerCase().includes(lower)) ||
                        (c.city && c.city.toLowerCase().includes(lower))
                )
            );
        }
    }, [clinicSearch, allClinics]);

    const handleHealthWorkerChange = (e) => {
        const { name, value } = e.target;
        setHealthWorkerData((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (role !== 'patient') return;
        healthWorkerAdminService.getGeography().then((data) => setGeoOptions((previous) => ({ ...previous, districts: data.districts || [] }))).catch(() => { });
    }, [role]);

    useEffect(() => {
        if (role !== 'health_worker') return;
        healthWorkerAdminService.getGeography().then((data) => setWorkerGeoOptions((previous) => ({ ...previous, states: data.states || [] }))).catch(() => { });
    }, [role]);

    useEffect(() => {
        if (!healthWorkerData.stateId) return;
        healthWorkerAdminService.getGeography({ stateId: healthWorkerData.stateId }).then((data) => setWorkerGeoOptions((previous) => ({ ...previous, districts: data.districts || [], areas: [] }))).catch(() => { });
    }, [healthWorkerData.stateId]);

    useEffect(() => {
        if (!healthWorkerData.districtId) return;
        healthWorkerAdminService.getGeography({ districtId: healthWorkerData.districtId }).then((data) => setWorkerGeoOptions((previous) => ({ ...previous, areas: data.areas || [] }))).catch(() => { });
    }, [healthWorkerData.districtId]);

    useEffect(() => {
        if (!patientData.districtId) return;
        healthWorkerAdminService.getGeography({ districtId: patientData.districtId }).then((data) => setGeoOptions((previous) => ({ ...previous, villages: data.villages || [], areas: [] }))).catch(() => { });
    }, [patientData.districtId]);

    useEffect(() => {
        if (!patientData.villageId || !patientData.districtId) return;
        healthWorkerAdminService.getGeography({ districtId: patientData.districtId, villageId: patientData.villageId }).then((data) => setGeoOptions((previous) => ({ ...previous, areas: data.areas || [] }))).catch(() => { });
    }, [patientData.villageId, patientData.districtId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await registerPatient(patientData);
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

    const handleHealthWorkerSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (healthWorkerData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (healthWorkerData.password !== healthWorkerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const payload = { ...healthWorkerData };
            delete payload.confirmPassword;
            await registerHealthWorker(payload);
            alert('Health Worker registration submitted. An administrator must verify your account before field access is enabled.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Health Worker registration failed');
        } finally {
            setLoading(false);
        }
    };

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
                    <span className="text-xs text-[#7d6974] font-medium hidden sm:inline">Already registered?</span>
                    <Link
                        to="/login"
                        className="px-4 py-1.5 rounded-full bg-white border border-[#f5e4ec] hover:border-[#f0d0dc] text-xs font-bold text-[#1c1218] transition shadow-xs"
                    >
                        Sign In
                    </Link>
                </div>
            </header>

            {/* Main Composition: Register LEFT + Mascot RIGHT */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6 md:py-10 z-20">
                {/* Left Column: Form Panel */}
                <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-6 w-full mx-auto lg:mx-0">
                    <div className="w-full p-6 sm:p-8 bg-white border border-[#f5e4ec] rounded-3xl shadow-xs flex flex-col gap-6 animate-fade-in-up">

                {/* Step 1: Select Role */}
                {!role && (
                    <div className="flex flex-col gap-6 text-center">
                        <div>
                            <h2 className="text-3xl font-black text-ink-black">Create Account</h2>
                            <p className="text-sm font-semibold text-ink-charcoal mt-1">Select your profile type to register</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                            <button
                                onClick={() => setRole('health_worker')}
                                className="p-6 bg-cream-surface border-2 border-ink-black rounded-2xl flex flex-col items-center gap-2 hover:-translate-y-1 hover:bg-icy-mint-soft hover:shadow cursor-pointer transition duration-200"
                            >
                                <span className="w-12 h-12 rounded-full bg-icy-mint flex items-center justify-center text-xl font-bold border border-ink-black">🧑‍⚕️</span>
                                <span className="font-bold text-ink-black">Health Worker</span>
                                <span className="text-xs text-ink-muted">Frontline care access</span>
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

                        {/* Health Worker Registration */}
                        {role === 'health_worker' && (
                            <form className="flex flex-col gap-4" onSubmit={handleHealthWorkerSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Full Name" id="worker-name" name="name" value={healthWorkerData.name} onChange={handleHealthWorkerChange} required />
                                    <Input label="Phone Number" id="worker-phone" name="phone" type="tel" value={healthWorkerData.phone} onChange={handleHealthWorkerChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Email Address" id="worker-email" name="email" type="email" value={healthWorkerData.email} onChange={handleHealthWorkerChange} required />
                                    <Input label="City / Location" id="worker-city" name="district" value={healthWorkerData.district} onChange={handleHealthWorkerChange} placeholder="e.g. Jamshedpur" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Password" id="worker-password" name="password" type="password" value={healthWorkerData.password} onChange={handleHealthWorkerChange} required />
                                    <Input label="Confirm Password" id="worker-confirm-password" name="confirmPassword" type="password" value={healthWorkerData.confirmPassword} onChange={handleHealthWorkerChange} required />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex flex-col gap-1 w-full text-left">
                                        <label className="text-xs font-semibold text-ink-charcoal uppercase tracking-wider">Worker Type</label>
                                        <select
                                            name="workerType"
                                            value={healthWorkerData.workerType}
                                            onChange={handleHealthWorkerChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-ink-black bg-white focus:ring-2 focus:ring-rose-mauve"
                                        >
                                            <option value="COMMUNITY_WORKER">Community Worker</option>
                                            <option value="ASHA">ASHA</option>
                                            <option value="ANM">ANM</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <p className="text-xs text-ink-muted">Your account will be reviewed by an administrator before Health Worker access is enabled.</p>
                                <Button type="submit" variant="primary" className="w-full" disabled={loading}>{loading ? 'Registering...' : 'Create Health Worker Account'}</Button>
                            </form>
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
                                            label="City / Location"
                                            id="region"
                                            name="region"
                                            value={patientData.region}
                                            onChange={handlePatientChange}
                                            placeholder="e.g. Jamshedpur"
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
                                        {/* Multi-Select Specialization */}
                                        <div className="flex flex-col gap-1.5 w-full text-left">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                                    Specialization(s) (Registered in India) <span className="text-rose-500">*</span>
                                                </label>
                                                {selectedSpecializations.length > 0 && (
                                                    <span className="text-xs font-semibold text-[#8e1d41] bg-[#ffe6ee] px-2 py-0.5 rounded-full">
                                                        {selectedSpecializations.length} selected
                                                    </span>
                                                )}
                                            </div>

                                            {/* Selected Specialization Chips */}
                                            {selectedSpecializations.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-[#fffcfd] border border-[#f5e4ec]">
                                                    {selectedSpecializations.map((spec) => (
                                                        <span
                                                            key={spec}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#ffe6ee] text-[#8e1d41] border border-[#f5c6d6] shadow-2xs"
                                                        >
                                                            <span>{spec}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSpecialization(spec)}
                                                                className="w-3.5 h-3.5 rounded-full bg-[#8e1d41]/10 hover:bg-[#8e1d41]/25 flex items-center justify-center text-[#8e1d41] transition-colors"
                                                                title="Remove specialization"
                                                            >
                                                                &times;
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="relative w-full">
                                                <select
                                                    id="specializationSelect"
                                                    value=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleAddSpecialization(e.target.value);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] shadow-xs text-sm transition duration-150 appearance-none pr-10 cursor-pointer"
                                                >
                                                    <option value="">
                                                        {selectedSpecializations.length === 0
                                                            ? '— Select Specialization(s) (NMC / AYUSH) —'
                                                            : '+ Add another Specialization...'}
                                                    </option>
                                                    {INDIAN_MEDICAL_SPECIALIZATIONS.filter(
                                                        (spec) => !selectedSpecializations.includes(spec)
                                                    ).map((spec) => (
                                                        <option key={spec} value={spec}>
                                                            {spec}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7d6974]">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Quick-add suggestions */}
                                            {selectedSpecializations.length === 0 && (
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                    <span className="text-[11px] text-[#7d6974] font-medium">Quick add:</span>
                                                    {[
                                                        'General Medicine / Internal Medicine',
                                                        'General Surgery',
                                                        'Pediatrics & Neonatology',
                                                        'Cardiology & Interventional Cardiology',
                                                        'Obstetrics & Gynaecology (OB-GYN)',
                                                        'Dermatology, Venereology & Leprosy (DVL)',
                                                        'Orthopaedics & Joint Replacement'
                                                    ].map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => handleAddSpecialization(s)}
                                                            className="text-[11px] px-2 py-0.5 rounded-lg border border-[#f5e4ec] bg-white hover:bg-[#ffe6ee] hover:border-[#f5c6d6] text-[#4a3c45] transition-colors"
                                                        >
                                                            + {s.split(' ')[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Medical Registration Number"
                                                id="medicalRegistrationNumber"
                                                name="medicalRegistrationNumber"
                                                value={doctorData.medicalRegistrationNumber}
                                                onChange={handleDoctorChange}
                                                required
                                                placeholder="e.g. 12345/MCI/2018"
                                            />
                                            <Input
                                                label="State Medical Council"
                                                id="stateMedicalCouncil"
                                                name="stateMedicalCouncil"
                                                value={doctorData.stateMedicalCouncil}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. Jharkhand Medical Council"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Primary Medical Qualification"
                                                id="primaryMedicalQualification"
                                                name="primaryMedicalQualification"
                                                value={doctorData.primaryMedicalQualification}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. MBBS, MD, MS, DNB"
                                            />
                                            <Input
                                                label="Medical College / University"
                                                id="medicalCollege"
                                                name="medicalCollege"
                                                value={doctorData.medicalCollege}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. AIIMS New Delhi / RIMS"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Graduation Year"
                                                id="graduationYear"
                                                name="graduationYear"
                                                value={doctorData.graduationYear}
                                                onChange={handleDoctorChange}
                                                placeholder="e.g. 2018"
                                            />
                                        </div>

                                        {/* Optional Link to Registered Hospital or Clinic */}
                                        <div className="flex flex-col gap-1.5 w-full text-left pt-2 border-t border-[#f5e4ec]">
                                            <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider flex items-center justify-between">
                                                <span>Link to Registered Hospital / Clinic</span>
                                                <span className="normal-case font-normal text-xs text-[#7d6974] bg-[#ffe6ee] px-2 py-0.5 rounded-full">Optional</span>
                                            </label>
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search registered hospitals or clinics..."
                                                    value={clinicSearch}
                                                    onChange={(e) => setClinicSearch(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-xl border border-[#f5e4ec] bg-white text-[#2d2329] placeholder:text-[#7d6974]/50 focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] text-xs transition duration-150"
                                                />
                                                <div className="relative w-full">
                                                    <select
                                                        name="clinicId"
                                                        value={doctorData.clinicId || ''}
                                                        onChange={handleDoctorChange}
                                                        disabled={clinicsLoading}
                                                        className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] shadow-xs text-sm transition duration-150 appearance-none pr-10 cursor-pointer"
                                                    >
                                                        <option value="">— Not linked to a registered hospital or clinic (link later) —</option>
                                                        {clinicOptions.map((clinic) => (
                                                            <option key={clinic.userId || clinic.id} value={clinic.userId || clinic.id}>
                                                                {clinic.clinicName || clinic.name} {clinic.city ? `(${clinic.city})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7d6974]">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {clinicsLoading && (
                                                    <span className="text-xs text-[#7d6974]">Loading registered medical centers…</span>
                                                )}
                                                <p className="text-xs text-[#7d6974]">
                                                    If your hospital or clinic is registered on Sanjeevani, link it here. You can also register or update clinic affiliations later in your dashboard.
                                                </p>
                                            </div>
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

                {/* Right Column: Static Minimalist Care Mascot */}
                <div className="lg:col-span-6 xl:col-span-6 hidden lg:flex items-center justify-center p-4">
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

export default Register;