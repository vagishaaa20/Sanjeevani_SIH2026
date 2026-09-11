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
    Check
} from 'lucide-react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
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
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [practiceLocations, setPracticeLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Document upload modal state
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadDocType, setUploadDocType] = useState('MEDICAL_REGISTRATION_CERTIFICATE');
    const [uploadDocFile, setUploadDocFile] = useState(null);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({
        fullName: '',
        city: '',
        specialization: '',
        yearsOfExperience: '',
        consultationFee: '',
        languages: '',
        bio: '',
    });

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

            setEditForm({
                fullName: prof.fullName || user?.email?.split('@')[0] || '',
                city: prof.city || '',
                specialization: prof.specialization || '',
                yearsOfExperience: prof.yearsOfExperience ? String(prof.yearsOfExperience) : '0',
                consultationFee: prof.consultationFee ? String(prof.consultationFee) : '500',
                languages: Array.isArray(prof.languages) ? prof.languages.join(', ') : '',
                bio: prof.bio || '',
            });

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

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const languagesArray = editForm.languages
                ? editForm.languages.split(',').map((l) => l.trim()).filter(Boolean)
                : [];

            const updates = {
                fullName: editForm.fullName.trim(),
                city: editForm.city.trim(),
                specialization: editForm.specialization.trim(),
                yearsOfExperience: editForm.yearsOfExperience ? parseInt(editForm.yearsOfExperience, 10) : 0,
                consultationFee: editForm.consultationFee ? parseFloat(editForm.consultationFee) : 500,
                languages: languagesArray,
                bio: editForm.bio.trim(),
            };

            const res = await api.patch('/doctors/profile', updates);
            setProfile(res.data?.profile || { ...profile, ...updates });
            setEditModalOpen(false);
            setSuccessMsg('Profile updated successfully!');
            if (refreshUser) refreshUser();
        } catch (err) {
            console.error('Failed to update doctor profile', err);
            setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
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
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-[#f5e4ec] animate-fade-in">
                <Loader2 className="w-8 h-8 text-[#e13b68] animate-spin" />
                <span className="text-sm font-bold text-[#7d6974]">Loading doctor profile & practice records…</span>
            </div>
        );
    }

    const verificationStatus = profile?.verificationStatus || user?.profile?.verificationStatus || 'PENDING_VERIFICATION';
    const isVerified = verificationStatus === 'VERIFIED';

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fade-in-up">
            {/* Notifications */}
            {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Doctor Hero Card */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-radial from-[#ffe6ee] to-transparent rounded-full pointer-events-none opacity-60" />

                <div className="flex items-start gap-4 md:gap-6 z-10">
                    <div className="w-18 h-18 md:w-20 md:h-20 rounded-3xl bg-linear-to-tr from-[#ffe6ee] to-[#fffcfd] border-2 border-[#f5c6d6] text-[#e13b68] flex items-center justify-center font-heading text-2xl md:text-3xl font-black shadow-xs flex-shrink-0">
                        {profile?.fullName ? profile.fullName.charAt(0) : 'D'}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                                Dr. {profile?.fullName || user?.email?.split('@')[0] || 'Doctor'}
                            </h1>
                            {isVerified ? (
                                <Badge variant="mint" dot>
                                    NMC Verified Practitioner
                                </Badge>
                            ) : (
                                <Badge variant="warning" dot>
                                    Pending Admin Verification
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs md:text-sm font-bold text-[#e13b68]">
                            {profile?.specialization || 'General Physician & Specialist'}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7d6974] font-medium mt-1">
                            {profile?.medicalRegistrationNumber && (
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#e13b68]" />
                                    Reg: <strong>{profile.medicalRegistrationNumber}</strong>
                                </span>
                            )}
                            {profile?.stateMedicalCouncil && (
                                <span>Council: <strong>{profile.stateMedicalCouncil}</strong></span>
                            )}
                            {profile?.city && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-[#e13b68]" />
                                    {profile.city}, India
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 z-10 self-start md:self-auto">
                    <button
                        onClick={() => setEditModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffe6ee] hover:bg-[#f5c6d6] text-[#8e1d41] text-xs font-bold transition shadow-2xs"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Profile
                    </button>
                    <Link
                        to="/doctor/clinics"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold transition shadow-xs"
                    >
                        <Building className="w-3.5 h-3.5" />
                        Manage Clinics
                    </Link>
                </div>
            </div>

            {/* Clinical Stats & Performance Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                    <div className="w-9 h-9 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center mb-1">
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        {stats?.uniquePatients ?? 0}
                    </span>
                    <span className="text-xs font-bold text-[#7d6974]">Patients Checked</span>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        {stats?.completedConsultations ?? 0}
                    </span>
                    <span className="text-xs font-bold text-[#7d6974]">Consultations Done</span>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs font-bold text-[#7d6974]">
                        Rating ({stats?.reviewCount ?? 0} reviews)
                    </span>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                    <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1">
                        <Building className="w-4 h-4" />
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-[#2d2329] font-heading">
                        {practiceLocations.length || 1}
                    </span>
                    <span className="text-xs font-bold text-[#7d6974]">Practice Clinics</span>
                </div>
            </div>

            {/* Practice Locations & Places Doctor Sits */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-[#2d2329] font-heading flex items-center gap-2">
                            <Building className="w-5 h-5 text-[#e13b68]" />
                            <span>Registered Practice Locations & Clinics</span>
                        </h2>
                        <p className="text-xs text-[#7d6974] font-medium mt-0.5">
                            Places and medical chambers where you conduct in-person patient consultations.
                        </p>
                    </div>

                    <Link
                        to="/doctor/clinics"
                        className="text-xs font-bold text-[#e13b68] hover:text-[#c92a55] flex items-center gap-1 transition"
                    >
                        <span>Manage & Add Clinics</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {practiceLocations.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#fffcfd] border border-dashed border-[#f5c6d6] text-center flex flex-col items-center justify-center gap-2">
                        <p className="text-xs text-[#7d6974] font-semibold">No custom practice locations registered yet.</p>
                        <Link
                            to="/doctor/clinics"
                            className="px-4 py-2 rounded-full bg-[#ffe6ee] text-[#8e1d41] text-xs font-bold hover:bg-[#f5c6d6] transition"
                        >
                            + Add Your Practice Chambers
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {practiceLocations.map((loc, idx) => (
                            <div
                                key={loc.id || idx}
                                className="p-4 rounded-2xl bg-[#fffcfd] border border-[#f5e4ec] flex flex-col gap-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Building className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#2d2329]">{loc.clinicName}</h4>
                                            <p className="text-xs text-[#7d6974] flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3 text-[#e13b68]" />
                                                <span>{loc.address}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-[#8e1d41] bg-[#ffe6ee] px-2 py-0.5 rounded-full">
                                        ₹{loc.consultationFee || 500} / visit
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-[#7d6974] pt-2 border-t border-[#f5e4ec]">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-[#7d6974]" />
                                        {loc.startTime || '09:00'} – {loc.endTime || '17:00'}
                                    </span>
                                    <div className="flex gap-1">
                                        {(loc.days || ['MON', 'WED', 'FRI']).map((d) => (
                                            <span key={d} className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold border border-[#f5e4ec]">
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
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-[#2d2329] font-heading flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#e13b68]" />
                            <span>Submitted Verification Documents</span>
                        </h2>
                        <p className="text-xs text-[#7d6974] font-medium mt-0.5">
                            Original credential PDFs submitted for administrative authentication and licensing verification.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setUploadModalOpen(true);
                            setUploadDocFile(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ffe6ee] hover:bg-[#f5c6d6] text-[#8e1d41] text-xs font-bold transition shadow-2xs"
                    >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Document</span>
                    </button>
                </div>

                {documents.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#fffcfd] border border-dashed border-[#f5c6d6] text-center flex flex-col items-center justify-center gap-2">
                        <p className="text-xs text-[#7d6974] font-semibold">No verification documents uploaded yet.</p>
                        <button
                            onClick={() => {
                                setUploadModalOpen(true);
                                setUploadDocFile(null);
                            }}
                            className="px-4 py-2 rounded-full bg-[#e13b68] text-white text-xs font-bold hover:bg-[#c92a55] transition"
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
                                    className="p-4 rounded-2xl bg-[#fffcfd] border border-[#f5e4ec] flex items-center justify-between gap-3 shadow-2xs hover:border-[#f5c6d6] transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-[#2d2329]">
                                                    {doc.documentType?.replace(/_/g, ' ') || 'Verification Document'}
                                                </h4>
                                                <Badge
                                                    variant={isDocApproved ? 'mint' : isDocRejected ? 'pink' : 'peach'}
                                                    className="text-[10px] px-2 py-0.2"
                                                >
                                                    {isDocApproved ? 'Approved' : isDocRejected ? 'Rejected' : 'Pending'}
                                                </Badge>
                                            </div>
                                            <span className="text-[11px] text-[#7d6974] font-medium mt-0.5">
                                                {doc.fileName} {doc.fileSize ? `· ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openDocumentPdf(doc.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#f5e4ec] bg-white hover:bg-[#ffe6ee] text-[#8e1d41] text-xs font-bold transition flex-shrink-0 shadow-2xs"
                                        title="View PDF"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
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
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-4">
                    <h3 className="text-base font-black text-[#2d2329] font-heading flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#e13b68]" />
                        <span>Academic & Professional Credentials</span>
                    </h3>

                    <div className="flex flex-col gap-3 text-xs">
                        <div className="flex justify-between py-2 border-b border-[#f5e4ec]">
                            <span className="font-semibold text-[#7d6974]">Primary Qualification</span>
                            <span className="font-bold text-[#2d2329]">{profile?.primaryMedicalQualification || 'MBBS / MD'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#f5e4ec]">
                            <span className="font-semibold text-[#7d6974]">Medical College</span>
                            <span className="font-bold text-[#2d2329]">{profile?.medicalCollege || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#f5e4ec]">
                            <span className="font-semibold text-[#7d6974]">Graduation Year</span>
                            <span className="font-bold text-[#2d2329]">{profile?.graduationYear || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#f5e4ec]">
                            <span className="font-semibold text-[#7d6974]">Experience</span>
                            <span className="font-bold text-[#2d2329]">{profile?.yearsOfExperience ? `${profile.yearsOfExperience} Years` : '—'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="font-semibold text-[#7d6974]">Languages Spoken</span>
                            <span className="font-bold text-[#2d2329]">
                                {Array.isArray(profile?.languages) && profile.languages.length > 0
                                    ? profile.languages.join(', ')
                                    : 'English, Hindi'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-4">
                    <h3 className="text-base font-black text-[#2d2329] font-heading flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-[#e13b68]" />
                        <span>Clinical Bio & Specialties</span>
                    </h3>

                    <p className="text-xs text-[#4a3c45] leading-relaxed font-medium">
                        {profile?.bio ||
                            'Dedicated healthcare practitioner providing compassionate clinical consultations and community medical guidance on the Sanjeevani platform.'}
                    </p>

                    <div className="pt-3 border-t border-[#f5e4ec]">
                        <span className="text-xs font-bold text-[#7d6974] block mb-2">Registered Specializations:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {(profile?.specialization ? profile.specialization.split(',') : ['General Medicine']).map((s) => (
                                <span
                                    key={s.trim()}
                                    className="px-3 py-1 rounded-full text-xs font-bold bg-[#ffe6ee] text-[#8e1d41] border border-[#f5c6d6]"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl border border-[#f5e4ec] max-w-lg w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-[#f5e4ec] pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#2d2329]">Edit Doctor Profile</h3>
                                    <p className="text-xs text-[#7d6974]">Update your public information and clinical details.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="p-2 rounded-xl text-[#7d6974] hover:bg-zinc-100 transition"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.city}
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                        Experience (Years)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.yearsOfExperience}
                                        onChange={(e) => setEditForm({ ...editForm, yearsOfExperience: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Specialization(s)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. General Medicine, Cardiology"
                                    value={editForm.specialization}
                                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Languages Spoken (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. English, Hindi, Bengali"
                                    value={editForm.languages}
                                    onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Professional Bio
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Describe your medical experience, specialty areas, and clinical focus..."
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] text-sm focus:ring-2 focus:ring-[#e13b68]/30 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-[#f5e4ec]">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-[#f5e4ec] bg-white hover:bg-zinc-50 text-[#7d6974] text-xs font-bold transition"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl border border-[#f5e4ec] max-w-md w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-[#f5e4ec] pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] text-[#e13b68] flex items-center justify-center">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#2d2329]">Upload Credential PDF</h3>
                                    <p className="text-xs text-[#7d6974]">Stored securely in encrypted private object storage.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setUploadModalOpen(false)}
                                className="p-2 rounded-xl text-[#7d6974] hover:bg-zinc-100 transition"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUploadDocument} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    Document Type <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={uploadDocType}
                                    onChange={(e) => setUploadDocType(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-2xl border border-[#f5e4ec] bg-white text-[#2d2329] focus:ring-2 focus:ring-[#e13b68]/30 focus:border-[#e13b68] text-sm focus:outline-none shadow-2xs font-medium"
                                >
                                    {DOCTOR_DOC_TYPES.map((dt) => (
                                        <option key={dt.value} value={dt.value}>
                                            {dt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[#4a3c45] uppercase tracking-wider">
                                    PDF Document File <span className="text-rose-500">*</span>
                                </label>
                                <div className="p-4 rounded-2xl border-2 border-dashed border-[#f5c6d6] bg-[#fffcfd] hover:bg-[#ffe6ee]/20 flex flex-col items-center justify-center gap-2 text-center transition cursor-pointer">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        required
                                        onChange={(e) => setUploadDocFile(e.target.files[0])}
                                        className="w-full text-xs text-[#7d6974] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#ffe6ee] file:text-[#8e1d41] hover:file:bg-[#f5c6d6]"
                                    />
                                    <span className="text-[11px] text-[#7d6974]">
                                        Strictly PDF only · Max 10MB file size
                                    </span>
                                </div>
                                {uploadDocFile && (
                                    <span className="text-xs font-bold text-emerald-700 mt-1 block">
                                        ✓ Selected: {uploadDocFile.name} ({(uploadDocFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-[#f5e4ec]">
                                <button
                                    type="submit"
                                    disabled={uploadingDoc}
                                    className="px-6 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    Upload & Submit for Review
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-[#f5e4ec] bg-white hover:bg-zinc-50 text-[#7d6974] text-xs font-bold transition"
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
