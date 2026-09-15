import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    User,
    Award,
    Building,
    FileText,
    CheckCircle2,
    Clock,
    IndianRupee,
    Calendar,
    Star,
    Users,
    Stethoscope,
    ShieldCheck,
    MapPin,
    ArrowUpRight,
    Edit3,
    Eye,
    UploadCloud,
    Loader2,
    AlertCircle,
    Check,
    Video,
    PhoneCall
} from 'lucide-react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import MinimalistAvatar from '../../components/common/MinimalistAvatar';
import { INDIAN_MEDICAL_SPECIALIZATIONS } from '../auth/Register';

const DOCTOR_DOC_TYPES = [
    { value: 'MEDICAL_REGISTRATION_CERTIFICATE', label: 'State Medical Council / NMC Certificate' },
    { value: 'MBBS_OR_PRIMARY_QUALIFICATION', label: 'MBBS / Primary Qualification Certificate' },
    { value: 'POSTGRADUATE_DEGREE', label: 'MD / MS / DNB / Diploma Degree Certificate' },
    { value: 'SPECIALIZATION_PROOF', label: 'Specialization Fellowship / Board Proof' },
    { value: 'GOVERNMENT_ID', label: 'Government Identity Proof (Aadhaar / PAN)' },
    { value: 'CLINIC_ESTABLISHMENT_LICENSE', label: 'Clinic / Hospital Establishment License' }
];

export const DoctorProfile = () => {
    const { user, refreshProfile, refreshUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [practiceLocations, setPracticeLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Document upload modal state
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadDocType, setUploadDocType] = useState('MEDICAL_REGISTRATION_CERTIFICATE');
    const [uploadDocFile, setUploadDocFile] = useState(null);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    // Edit Profile Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modalErrorMsg, setModalErrorMsg] = useState('');
    const [gpsStatusMsg, setGpsStatusMsg] = useState('');
    const [editForm, setEditForm] = useState({
        fullName: '',
        city: '',
        state: '',
        address: '',
        pincode: '',
        clinicOrHospital: '',
        latitude: '',
        longitude: '',
        specialization: '',
        practiceStartYear: '',
        yearsOfExperience: '',
        consultationFee: '500',
        teleconsultationFee: '500',
        languages: '',
        bio: '',
    });
    const [selectedSpecializations, setSelectedSpecializations] = useState([]);
    const [customSpecialization, setCustomSpecialization] = useState('');
    const [detectingGps, setDetectingGps] = useState(false);
    const [gpsSuccess, setGpsSuccess] = useState(false);

    const INDIAN_CITY_COORDINATES = {
        'delhi': { lat: 28.6139, lng: 77.2090 },
        'new delhi': { lat: 28.6139, lng: 77.2090 },
        'noida': { lat: 28.5355, lng: 77.3910 },
        'gurgaon': { lat: 28.4595, lng: 77.0266 },
        'gurugram': { lat: 28.4595, lng: 77.0266 },
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'bengaluru': { lat: 12.9716, lng: 77.5946 },
        'bangalore': { lat: 12.9716, lng: 77.5946 },
        'hyderabad': { lat: 17.3850, lng: 78.4867 },
        'kolkata': { lat: 22.5726, lng: 88.3639 },
        'chennai': { lat: 13.0827, lng: 80.2707 },
        'pune': { lat: 18.5204, lng: 73.8567 },
        'ahmedabad': { lat: 23.0225, lng: 72.5714 },
        'jaipur': { lat: 26.9124, lng: 75.7873 },
        'lucknow': { lat: 26.8467, lng: 80.9462 },
        'kanpur': { lat: 26.4499, lng: 80.3319 },
        'jamshedpur': { lat: 22.8046, lng: 86.2029 },
        'ranchi': { lat: 23.3441, lng: 85.3096 },
        'dhanbad': { lat: 23.7957, lng: 86.4304 },
        'bokaro': { lat: 23.6693, lng: 86.1511 },
        'patna': { lat: 25.5941, lng: 85.1376 },
        'gaya': { lat: 24.7955, lng: 85.0002 },
        'bhopal': { lat: 23.2599, lng: 77.4126 },
        'indore': { lat: 22.7196, lng: 75.8577 },
        'chandigarh': { lat: 30.7333, lng: 76.7794 },
        'kochi': { lat: 9.9312, lng: 76.2673 },
        'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
        'guwahati': { lat: 26.1445, lng: 91.7362 },
        'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
        'cuttack': { lat: 20.4625, lng: 85.8828 },
        'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
        'vijayawada': { lat: 16.5062, lng: 80.6480 },
        'varanasi': { lat: 25.3176, lng: 82.9739 },
        'agra': { lat: 27.1767, lng: 78.0081 },
        'dehradun': { lat: 30.3165, lng: 78.0322 },
        'shimla': { lat: 31.1048, lng: 77.1734 },
    };

    useEffect(() => {
        loadDoctorProfile();
    }, []);

    const loadDoctorProfile = async () => {
        setLoading(true);
        try {
            // Load base profile
            const profRes = await api.get('/profile/me');
            const prof = profRes.data?.profile || {};
            setProfile(prof);

            const currentYear = new Date().getFullYear();
            const startYear = prof.practiceStartYear ? String(prof.practiceStartYear) : (
                prof.yearsOfExperience ? String(currentYear - parseInt(prof.yearsOfExperience, 10)) : ''
            );
            const expYears = prof.yearsOfExperience ? String(prof.yearsOfExperience) : (
                startYear ? String(Math.max(0, currentYear - parseInt(startYear, 10))) : '0'
            );

            const specs = prof.specialization 
                ? prof.specialization.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            setSelectedSpecializations(specs);

            setEditForm({
                fullName: prof.fullName || user?.profile?.fullName || user?.email?.split('@')[0] || '',
                city: prof.city || '',
                state: prof.state || '',
                address: prof.address || '',
                pincode: prof.pincode || '',
                clinicOrHospital: prof.clinicOrHospital || '',
                latitude: prof.latitude ? String(prof.latitude) : '',
                longitude: prof.longitude ? String(prof.longitude) : '',
                specialization: prof.specialization || '',
                practiceStartYear: startYear,
                yearsOfExperience: expYears,
                consultationFee: prof.consultationFee ? String(prof.consultationFee) : '500',
                teleconsultationFee: prof.teleconsultationFee ? String(prof.teleconsultationFee) : '500',
                languages: Array.isArray(prof.languages) ? prof.languages.join(', ') : '',
                bio: prof.bio || '',
            });

            if (prof.latitude && prof.longitude) {
                setGpsSuccess(true);
            }

            // Load clinical stats overview
            const statsRes = await api.get('/doctors/stats/overview').catch(() => ({ data: { stats: {} } }));
            setStats(statsRes.data?.stats || {});
            
            const locs = statsRes.data?.practiceLocations || prof.availability?.practiceLocations || [];
            setPracticeLocations(locs);

            // Load verification documents
            const docsRes = await api.get('/documents/me').catch(() => ({ data: { documents: [] } }));
            setDocuments(docsRes.data?.documents || []);
        } catch (err) {
            console.error('Failed to load doctor profile data', err);
            setErrorMsg('Failed to load complete profile data. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSpecialization = (spec) => {
        if (!spec || !spec.trim()) return;
        const trimmed = spec.trim();
        if (!selectedSpecializations.includes(trimmed)) {
            const updated = [...selectedSpecializations, trimmed];
            setSelectedSpecializations(updated);
            setEditForm(prev => ({ ...prev, specialization: updated.join(', ') }));
        }
    };

    const handleRemoveSpecialization = (spec) => {
        const updated = selectedSpecializations.filter(s => s !== spec);
        setSelectedSpecializations(updated);
        setEditForm(prev => ({ ...prev, specialization: updated.join(', ') }));
    };

    const handlePracticeStartYearChange = (val) => {
        const currentYear = new Date().getFullYear();
        const startYr = parseInt(val, 10);
        const calculatedExp = !isNaN(startYr) && startYr > 1950 && startYr <= currentYear
            ? String(currentYear - startYr)
            : editForm.yearsOfExperience;

        setEditForm(prev => ({
            ...prev,
            practiceStartYear: val,
            yearsOfExperience: calculatedExp
        }));
    };

    const handleExperienceChange = (val) => {
        const currentYear = new Date().getFullYear();
        const exp = parseInt(val, 10);
        const calculatedStart = !isNaN(exp) && exp >= 0
            ? String(currentYear - exp)
            : editForm.practiceStartYear;

        setEditForm(prev => ({
            ...prev,
            yearsOfExperience: val,
            practiceStartYear: calculatedStart
        }));
    };

    // Robust geocoding helper that queries Nominatim / Local dictionary
    const geocodeLocation = async (city, pincode, state, address) => {
        const cleanCity = (city || '').trim().toLowerCase();
        if (cleanCity && INDIAN_CITY_COORDINATES[cleanCity]) {
            return INDIAN_CITY_COORDINATES[cleanCity];
        }

        // Try OpenStreetMap Nominatim for precise lookup
        try {
            const queryParts = [address, cleanCity, state, pincode, 'India'].filter(Boolean);
            const query = encodeURIComponent(queryParts.join(', '));
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
        } catch (e) {
            console.warn('Nominatim lookup error:', e);
        }

        // Fallback to partial matches in dictionary
        for (const [key, coords] of Object.entries(INDIAN_CITY_COORDINATES)) {
            if (cleanCity.includes(key) || key.includes(cleanCity)) {
                return coords;
            }
        }

        return null;
    };

    const handleDetectGps = async () => {
        setDetectingGps(true);
        setGpsStatusMsg('Locating practice coordinates...');
        setModalErrorMsg('');

        let coordinatesFound = false;

        if (navigator.geolocation) {
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 6000,
                        maximumAge: 0
                    });
                });

                const lat = pos.coords.latitude.toFixed(6);
                const lng = pos.coords.longitude.toFixed(6);
                setEditForm(prev => ({
                    ...prev,
                    latitude: String(lat),
                    longitude: String(lng)
                }));
                setGpsSuccess(true);
                setGpsStatusMsg(`📍 Live GPS Locked: (${lat}, ${lng})`);
                coordinatesFound = true;
            } catch (geoErr) {
                console.warn('Browser GPS timed out or denied, falling back to geocoding:', geoErr.message);
            }
        }

        if (!coordinatesFound) {
            // Geocode using City / PIN / Address
            const geo = await geocodeLocation(editForm.city, editForm.pincode, editForm.state, editForm.address);
            if (geo) {
                const lat = geo.lat.toFixed(6);
                const lng = geo.lng.toFixed(6);
                setEditForm(prev => ({
                    ...prev,
                    latitude: String(lat),
                    longitude: String(lng)
                }));
                setGpsSuccess(true);
                setGpsStatusMsg(`📍 Regional Coordinates Set: (${lat}, ${lng}) [${editForm.city || 'India'}]`);
            } else {
                setGpsStatusMsg('Please enter your City or PIN Code to set coordinates.');
            }
        }

        setDetectingGps(false);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setModalErrorMsg('');
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const languagesArray = editForm.languages
                ? editForm.languages.split(',').map((l) => l.trim()).filter(Boolean)
                : [];

            const specString = selectedSpecializations.length > 0 
                ? selectedSpecializations.join(', ') 
                : editForm.specialization.trim();

            let finalLat = editForm.latitude ? parseFloat(editForm.latitude) : null;
            let finalLng = editForm.longitude ? parseFloat(editForm.longitude) : null;

            // Auto-resolve coordinates if not filled yet
            if ((!finalLat || !finalLng) && editForm.city) {
                const resolved = await geocodeLocation(editForm.city, editForm.pincode, editForm.state, editForm.address);
                if (resolved) {
                    finalLat = resolved.lat;
                    finalLng = resolved.lng;
                }
            }

            const updates = {
                fullName: editForm.fullName.trim(),
                city: editForm.city.trim(),
                state: editForm.state.trim(),
                address: editForm.address.trim(),
                pincode: editForm.pincode.trim(),
                clinicOrHospital: editForm.clinicOrHospital.trim(),
                latitude: finalLat,
                longitude: finalLng,
                specialization: specString,
                practiceStartYear: editForm.practiceStartYear ? parseInt(editForm.practiceStartYear, 10) : null,
                yearsOfExperience: editForm.yearsOfExperience ? parseInt(editForm.yearsOfExperience, 10) : 0,
                consultationFee: editForm.consultationFee ? parseFloat(editForm.consultationFee) : 500,
                teleconsultationFee: editForm.teleconsultationFee ? parseFloat(editForm.teleconsultationFee) : 500,
                languages: languagesArray,
                bio: editForm.bio.trim(),
            };

            const res = await api.patch('/doctors/profile', updates);
            const savedProfile = res.data?.profile || { ...profile, ...updates };
            setProfile(savedProfile);
            setEditModalOpen(false);
            setSuccessMsg('Profile, consultation fees, and practice location updated successfully!');
            if (refreshProfile) refreshProfile();
            if (refreshUser) refreshUser();
        } catch (err) {
            console.error('Failed to update doctor profile', err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update profile. Please verify your details.';
            setModalErrorMsg(errMsg);
            setErrorMsg(errMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleUploadDocument = async (e) => {
        e.preventDefault();
        if (!uploadDocFile) {
            setErrorMsg('Please select a PDF document file to upload.');
            return;
        }

        setUploadingDoc(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const formData = new FormData();
            formData.append('documentType', uploadDocType);
            formData.append('file', uploadDocFile);

            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Reload documents
            const docsRes = await api.get('/documents/me').catch(() => ({ data: { documents: [] } }));
            setDocuments(docsRes.data?.documents || []);

            setUploadModalOpen(false);
            setUploadDocFile(null);
            setSuccessMsg('Verification document uploaded securely and queued for review!');
        } catch (err) {
            console.error('Failed to upload document', err);
            setErrorMsg(err.response?.data?.error || 'Failed to upload verification document. Ensure it is a valid PDF under 10MB.');
        } finally {
            setUploadingDoc(false);
        }
    };

    const openDocumentPdf = async (docId) => {
        try {
            const res = await api.get(`/documents/${docId}/signed-url`);
            if (res.data?.signedUrl) {
                window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
            } else {
                alert('Could not generate document preview URL.');
            }
        } catch (err) {
            console.error('Failed to open document PDF', err);
            alert('Error loading document PDF.');
        }
    };

    if (loading) {
        return (
            <div 
                className="p-16 text-center flex flex-col items-center justify-center gap-3 rounded-3xl animate-fade-in"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Loading doctor profile &amp; practice records…</span>
            </div>
        );
    }

    const verificationStatus = profile?.verificationStatus || user?.profile?.verificationStatus || 'PENDING_VERIFICATION';
    const isVerified = verificationStatus === 'VERIFIED';

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            {/* Notifications */}
            {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Doctor Hero Card */}
            <div 
                className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-start gap-4 md:gap-6 z-10">
                    <MinimalistAvatar
                        name={profile?.fullName || 'Doctor'}
                        role="doctor"
                        size={72}
                        showStatus={true}
                        status="online"
                    />

                    <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl md:text-3xl font-black font-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                Dr. {profile?.fullName || user?.email?.split('@')[0] || 'Doctor'}
                            </h1>
                            {isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-bold">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    NMC Verified Practitioner
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-bold">
                                    Pending Admin Verification
                                </span>
                            )}
                        </div>

                        <p className="text-xs md:text-sm font-bold" style={{ color: 'var(--accent)' }}>
                            {profile?.specialization || 'General Physician & Specialist'}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {profile?.medicalRegistrationNumber && (
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                    <span>Reg:</span>
                                    <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile.medicalRegistrationNumber}</strong>
                                </span>
                            )}
                            {profile?.stateMedicalCouncil && (
                                <span>Council: <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile.stateMedicalCouncil}</strong></span>
                            )}
                            {profile?.city && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                    <span>{profile.city}, India</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 z-10 self-start md:self-auto">
                    <button
                        onClick={() => setEditModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition shadow-2xs hover:opacity-90 cursor-pointer"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        <Edit3 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span>Edit Profile</span>
                    </button>
                    <Link
                        to="/doctor/clinics"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold transition shadow-xs hover:opacity-95"
                        style={{ background: 'var(--accent)' }}
                    >
                        <Building className="w-3.5 h-3.5" />
                        <span>Manage Clinics</span>
                    </Link>
                </div>
            </div>

            {/* Clinical Stats & Performance Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div 
                        className="w-9 h-9 rounded-2xl flex items-center justify-center mb-1"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        {stats?.uniquePatients ?? 0}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Patients Checked</span>
                </div>

                <div 
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        {stats?.completedConsultations ?? 0}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Consultations Done</span>
                </div>

                <div 
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                        Rating ({stats?.reviewCount ?? 0} reviews)
                    </span>
                </div>

                <div 
                    className="rounded-3xl p-5 shadow-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-1">
                        <Building className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>
                        {practiceLocations.length || 1}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Practice Clinics</span>
                </div>
            </div>

            {/* Practice Locations & Places Doctor Sits */}
            <div 
                className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black font-heading flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Building className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                            <span>Registered Practice Locations &amp; Clinics</span>
                        </h2>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            Places and medical chambers where you conduct in-person patient consultations.
                        </p>
                    </div>

                    <Link
                        to="/doctor/clinics"
                        className="text-xs font-bold flex items-center gap-1 transition hover:opacity-90"
                        style={{ color: 'var(--accent)' }}
                    >
                        <span>Manage &amp; Add Clinics</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {practiceLocations.length === 0 ? (
                    <div 
                        className="p-6 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center gap-2"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                    >
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>No custom practice locations registered yet.</p>
                        <Link
                            to="/doctor/clinics"
                            className="px-4 py-2 rounded-full text-xs font-bold transition shadow-2xs hover:opacity-90"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                        >
                            + Add Your Practice Chambers
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {practiceLocations.map((loc, idx) => (
                            <div
                                key={loc.id || idx}
                                className="p-4 rounded-2xl flex flex-col gap-3 shadow-2xs"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5">
                                        <div 
                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                        >
                                            <Building className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{loc.clinicName}</h4>
                                            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                                <MapPin className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                                                <span>{loc.address}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span 
                                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                    >
                                        ₹{loc.consultationFee || 500} / visit
                                    </span>
                                </div>

                                <div 
                                    className="flex items-center justify-between text-xs pt-2"
                                    style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {loc.startTime || '09:00'} – {loc.endTime || '17:00'}
                                    </span>
                                    <div className="flex gap-1">
                                        {(loc.days || ['MON', 'WED', 'FRI']).map((d) => (
                                            <span 
                                                key={d} 
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                            >
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submitted Verification Documents Section */}
            <div 
                className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black font-heading flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                            <span>Submitted Verification Documents</span>
                        </h2>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            Original credential PDFs submitted for administrative authentication and licensing verification.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setUploadModalOpen(true);
                            setUploadDocFile(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition shadow-2xs hover:opacity-90 cursor-pointer"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        <UploadCloud className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span>Upload Document</span>
                    </button>
                </div>

                {documents.length === 0 ? (
                    <div 
                        className="p-6 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center gap-2"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                    >
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>No verification documents uploaded yet.</p>
                        <button
                            onClick={() => {
                                setUploadModalOpen(true);
                                setUploadDocFile(null);
                            }}
                            className="px-4 py-2 rounded-full text-white text-xs font-bold transition shadow-xs cursor-pointer"
                            style={{ background: 'var(--accent)' }}
                        >
                            + Upload Verification Documents
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => {
                            const isDocApproved = doc.status === 'APPROVED';
                            const isDocPending = doc.status === 'PENDING';
                            const isDocRejected = doc.status === 'REJECTED';

                            return (
                                <div
                                    key={doc.id}
                                    className="p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xs transition"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                        >
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    {doc.documentType?.replace(/_/g, ' ') || 'Verification Document'}
                                                </h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                                    isDocApproved 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                                                        : isDocRejected 
                                                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' 
                                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                }`}>
                                                    {isDocApproved ? 'Approved' : isDocRejected ? 'Rejected' : 'Pending'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                                {doc.fileName} {doc.fileSize ? `· ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openDocumentPdf(doc.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 shadow-2xs hover:opacity-90 cursor-pointer"
                                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        title="View PDF"
                                    >
                                        <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                        <span>View PDF</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Qualifications, Education & Bio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-4"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <h3 className="text-base font-black font-heading flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Award className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                        <span>Academic &amp; Professional Credentials</span>
                    </h3>

                    <div className="flex flex-col gap-3 text-xs">
                        <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Primary Qualification</span>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.primaryMedicalQualification || 'MBBS / MD'}</span>
                        </div>
                        <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Medical College</span>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.medicalCollege || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Graduation Year</span>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.graduationYear || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Practice Start Year</span>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.practiceStartYear || (profile?.yearsOfExperience ? new Date().getFullYear() - profile.yearsOfExperience : '—')}</span>
                        </div>
                        <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Experience</span>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.yearsOfExperience ? `${profile.yearsOfExperience} Years` : '—'}</span>
                        </div>
                        <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>In-Person Clinic Fee</span>
                            <span className="font-bold text-emerald-500">₹{profile?.consultationFee || 500}</span>
                        </div>
                        <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                <Video className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                <span>Teleconsultation Fee</span>
                            </span>
                            <span className="font-bold" style={{ color: 'var(--accent)' }}>₹{profile?.teleconsultationFee || 500}</span>
                        </div>
                        <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Practice Address</span>
                            <span className="font-bold text-right max-w-[60%]" style={{ color: 'var(--text-primary)' }}>
                                {[profile?.address, profile?.city, profile?.state, profile?.pincode ? `PIN: ${profile.pincode}` : null].filter(Boolean).join(', ') || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Languages Spoken</span>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                {Array.isArray(profile?.languages) && profile.languages.length > 0
                                    ? profile.languages.join(', ')
                                    : 'English, Hindi'}
                            </span>
                        </div>
                    </div>
                </div>

                <div 
                    className="rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-4"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                    <h3 className="text-base font-black font-heading flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Stethoscope className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                        <span>Clinical Bio &amp; Specialties</span>
                    </h3>

                    <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {profile?.bio ||
                            'Dedicated healthcare practitioner providing compassionate clinical consultations and community medical guidance on the Sanjeevani platform.'}
                    </p>

                    <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                        <span className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>Registered Specializations:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {(profile?.specialization ? profile.specialization.split(',') : ['General Medicine']).map((s) => (
                                <span
                                    key={s.trim()}
                                    className="px-3 py-1 rounded-full text-xs font-bold"
                                    style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                                >
                                    {s.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div 
                        className="rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                >
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black font-heading" style={{ color: 'var(--text-primary)' }}>Edit Doctor Profile</h3>
                                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Update your clinical credentials, specializations, consultation fees, and practice location.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="p-2 rounded-xl transition cursor-pointer hover:opacity-80"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                            {/* Personal Info */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            {/* Specialization Multi-Select */}
                            <div 
                                className="flex flex-col gap-2 p-4 rounded-2xl"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                        <Stethoscope className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                        <span>Specialization(s) (NMC / Registered in India) <span className="text-rose-500">*</span></span>
                                    </label>
                                    {selectedSpecializations.length > 0 && (
                                        <span 
                                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                        >
                                            {selectedSpecializations.length} selected
                                        </span>
                                    )}
                                </div>

                                {/* Active Specialization Chips */}
                                {selectedSpecializations.length > 0 && (
                                    <div 
                                        className="flex flex-wrap gap-1.5 p-2 rounded-xl"
                                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                                    >
                                        {selectedSpecializations.map((spec) => (
                                            <span
                                                key={spec}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs"
                                                style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                                            >
                                                <span>{spec}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSpecialization(spec)}
                                                    className="w-4 h-4 rounded-full flex items-center justify-center text-xs transition cursor-pointer hover:opacity-80"
                                                    style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--accent)' }}
                                                    title="Remove specialization"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Specialization Dropdown */}
                                <div className="relative w-full">
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleAddSpecialization(e.target.value);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30 text-xs font-semibold cursor-pointer appearance-none pr-8"
                                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">
                                            {selectedSpecializations.length === 0
                                                ? '— Select Specialization(s) from Indian Medical Board —'
                                                : '+ Add another Specialization...'}
                                        </option>
                                        {INDIAN_MEDICAL_SPECIALIZATIONS.filter(
                                             (s) => !selectedSpecializations.includes(s)
                                        ).map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: 'var(--text-secondary)' }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Custom Specialization addition */}
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="text"
                                        placeholder="Or type custom specialty..."
                                        value={customSpecialization}
                                        onChange={(e) => setCustomSpecialization(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (customSpecialization.trim()) {
                                                    handleAddSpecialization(customSpecialization);
                                                    setCustomSpecialization('');
                                                }
                                            }
                                        }}
                                        className="flex-1 px-3.5 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e13b68]/30"
                                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (customSpecialization.trim()) {
                                                handleAddSpecialization(customSpecialization);
                                                setCustomSpecialization('');
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                                        style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>

                            {/* Practice Start Year & Auto-Calculated Experience */}
                            <div 
                                className="p-4 rounded-2xl flex flex-col gap-3"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                        <Award className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                        <span>Clinical Experience Calculation</span>
                                    </span>
                                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                                        Current Year: {new Date().getFullYear()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                            Year Started Practice
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 2018"
                                            min="1960"
                                            max={new Date().getFullYear()}
                                            value={editForm.practiceStartYear}
                                            onChange={(e) => handlePracticeStartYearChange(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                            Total Experience (Years)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editForm.yearsOfExperience}
                                            onChange={(e) => handleExperienceChange(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                {editForm.practiceStartYear && (
                                    <p className="text-xs font-bold text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                                        ✓ Actively practicing since {editForm.practiceStartYear} · {editForm.yearsOfExperience} years of medical experience calculated for {new Date().getFullYear()}.
                                    </p>
                                )}
                            </div>

                            {/* Practice Location & Address Management */}
                            <div 
                                className="p-4 rounded-2xl flex flex-col gap-3"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                            >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                        <MapPin className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                        <span>Practice Location &amp; Regional Visibility</span>
                                    </span>

                                    <button
                                        type="button"
                                        onClick={handleDetectGps}
                                        disabled={detectingGps}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                                        style={{ background: 'var(--accent)' }}
                                    >
                                        <MapPin className={`w-3.5 h-3.5 ${detectingGps ? 'animate-bounce' : ''}`} />
                                        <span>{detectingGps ? 'Locating...' : '📍 Auto-Detect / Geocode Location'}</span>
                                    </button>
                                </div>

                                {gpsStatusMsg && (
                                    <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500 text-xs font-semibold flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                        <span>{gpsStatusMsg}</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        Chamber / Clinic / Hospital Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sanjeevani Care Clinic / Tata Main Hospital"
                                        value={editForm.clinicOrHospital}
                                        onChange={(e) => setEditForm({ ...editForm, clinicOrHospital: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        Street Address / Area / Locality
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Plot 42, Bistupur Main Road"
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                            City <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Jamshedpur"
                                            value={editForm.city}
                                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Jharkhand"
                                            value={editForm.state}
                                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                            PIN Code
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 831001"
                                            maxLength="6"
                                            value={editForm.pincode}
                                            onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Latitude (GPS)</label>
                                        <input
                                            type="text"
                                            placeholder="22.8046"
                                            value={editForm.latitude}
                                            onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Longitude (GPS)</label>
                                        <input
                                            type="text"
                                            placeholder="86.2029"
                                            value={editForm.longitude}
                                            onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                {editForm.latitude && editForm.longitude ? (
                                    <p className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                                        📍 Geolocation Active: ({Number(editForm.latitude).toFixed(4)}, {Number(editForm.longitude).toFixed(4)}). Patients within your radius can view distance to your chamber.
                                    </p>
                                ) : (
                                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Tip: Click "Auto-Detect / Geocode Location" or enter your city/PIN code so patients can see live driving distance.
                                    </p>
                                )}
                            </div>

                            {/* Consultation Fees Configuration (In-person & Teleconsultation) */}
                            <div 
                                className="p-4 rounded-2xl flex flex-col gap-3"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                        <IndianRupee className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                        <span>Consultation Fees Configuration</span>
                                    </span>
                                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        Displayed directly on patient search &amp; booking
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div 
                                        className="flex flex-col gap-1.5 p-3 rounded-xl"
                                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                                    >
                                        <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Building className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>In-Person Clinic Fee (₹)</span>
                                        </label>
                                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Physical consultation at clinic or chamber</p>
                                        <div className="relative mt-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editForm.consultationFee}
                                                onChange={(e) => setEditForm({ ...editForm, consultationFee: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                    </div>

                                    <div 
                                        className="flex flex-col gap-1.5 p-3 rounded-xl"
                                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                                    >
                                        <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                                            <Video className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                            <span>Teleconsultation Fee (₹)</span>
                                        </label>
                                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Online video &amp; audio triage calls</p>
                                        <div className="relative mt-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--accent)' }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editForm.teleconsultationFee}
                                                onChange={(e) => setEditForm({ ...editForm, teleconsultationFee: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Languages Spoken */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                                    Languages Spoken (Comma-Separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. English, Hindi, Bengali, Odia"
                                    value={editForm.languages}
                                    onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            {/* Bio */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                                    Professional Bio
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Describe your medical experience, specialty areas, and clinical focus..."
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            {/* Modal error display */}
                            {modalErrorMsg && (
                                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span>{modalErrorMsg}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer hover:opacity-80"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div 
                        className="rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                                >
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black font-heading" style={{ color: 'var(--text-primary)' }}>Upload Credential PDF</h3>
                                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Stored securely in encrypted private object storage.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setUploadModalOpen(false)}
                                className="p-2 rounded-xl transition cursor-pointer hover:opacity-80"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUploadDocument} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                                    Document Type <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={uploadDocType}
                                    onChange={(e) => setUploadDocType(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none shadow-2xs font-medium cursor-pointer"
                                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                >
                                    {DOCTOR_DOC_TYPES.map((dt) => (
                                        <option key={dt.value} value={dt.value}>
                                            {dt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                                    PDF Document File <span className="text-rose-500">*</span>
                                </label>
                                <div 
                                    className="p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-center transition cursor-pointer"
                                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                                >
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        required
                                        onChange={(e) => setUploadDocFile(e.target.files[0])}
                                        className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:cursor-pointer"
                                        style={{ color: 'var(--text-secondary)' }}
                                    />
                                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                        Strictly PDF only · Max 10MB file size
                                    </span>
                                </div>
                                {uploadDocFile && (
                                    <span className="text-xs font-bold text-emerald-500 mt-1 block">
                                        ✓ Selected: {uploadDocFile.name} ({(uploadDocFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="submit"
                                    disabled={uploadingDoc}
                                    className="px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    Upload &amp; Submit for Review
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer hover:opacity-80"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorProfile;
