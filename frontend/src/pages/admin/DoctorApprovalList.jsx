import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const DOCUMENT_TYPE_LABELS = {
    MEDICAL_REGISTRATION_CERTIFICATE: 'Medical Registration Certificate',
    MBBS_OR_PRIMARY_QUALIFICATION: 'MBBS / Primary Qualification',
    INTERNSHIP_COMPLETION_CERTIFICATE: 'Internship Completion Certificate',
    GOVERNMENT_IDENTITY: 'Government Identity',
    PROFESSIONAL_PHOTOGRAPH: 'Professional Photograph',
    PG_QUALIFICATION_CERTIFICATE: 'PG Qualification Certificate',
    ADDITIONAL_QUALIFICATION_PROOF: 'Additional Qualification Proof',
    COLLEGE_OR_INSTITUTION_ID: 'College / Institution ID',
    RESIDENCY_PROOF: 'Residency Proof',
    INTERNSHIP_PROOF: 'Internship Proof',
    SPECIALIZATION_PROOF: 'Specialization Proof',
};

const DOC_STATUS_CONFIG = {
    PENDING: { variant: 'warning', label: 'Pending' },
    ACCEPTED: { variant: 'success', label: 'Accepted' },
    REJECTED: { variant: 'error', label: 'Rejected' },
};

const VERIFY_STATUS_CONFIG = {
    pending_verification: { variant: 'warning', label: 'Pending' },
    under_review: { variant: 'info', label: 'Under Review' },
    verified: { variant: 'success', label: 'Verified' },
    rejected: { variant: 'error', label: 'Rejected' },
    suspended: { variant: 'error', label: 'Suspended' },
};

const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─────────────────────────────────────────────────────────────────────────────
// DocumentsSection — rendered inside each doctor card
// ─────────────────────────────────────────────────────────────────────────────
const DocumentsSection = ({ userId, expanded }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actioning, setActioning] = useState(null); // docId being acted upon
    const [msg, setMsg] = useState({ type: '', text: '' });

    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        if (!expanded) return;
        setLoading(true);
        api.get(`/admin/users/${userId}`)
            .then((res) => setDocuments(res.data.documents || []))
            .catch((err) => setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to load documents' }))
            .finally(() => setLoading(false));
    }, [userId, expanded]);

    const handleDocAction = async (docId, status) => {
        setActioning(docId);
        setMsg({ type: '', text: '' });
        try {
            await api.patch(`/admin/documents/${docId}`, { status });
            setDocuments((prev) =>
                prev.map((d) => (d.id === docId ? { ...d, status } : d))
            );
            setMsg({ type: 'success', text: `Document ${status === 'ACCEPTED' ? 'accepted' : 'rejected'}.` });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Action failed' });
        } finally {
            setActioning(null);
        }
    };

    if (!expanded) return null;

    return (
        <div className="mt-3 flex flex-col gap-3 border-t border-ink-black/10 pt-4">
            <h4 className="text-xs font-black text-ink-black uppercase tracking-wide">
                📄 Verification Documents
            </h4>

            {msg.text && (
                <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {msg.text}
                </p>
            )}

            {loading ? (
                <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-t-pastel-pink-action border-r-transparent border-b-cerulean border-l-transparent rounded-full animate-spin" />
                </div>
            ) : documents.length === 0 ? (
                <p className="text-xs text-ink-muted font-medium italic">No documents uploaded yet by this doctor.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {documents.map((doc) => {
                        const statusCfg = DOC_STATUS_CONFIG[doc.status] || DOC_STATUS_CONFIG.PENDING;
                        const friendlyType = DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType;
                        const isActioning = actioning === doc.id;

                        return (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between gap-3 flex-wrap bg-cream-bg rounded-xl px-4 py-3"
                            >
                                <div className="flex flex-col gap-0.5 flex-grow">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs font-bold text-ink-black">{friendlyType}</p>
                                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                                    </div>
                                    <p className="text-2xs text-ink-muted font-medium">
                                        {doc.originalFileName} · {formatBytes(doc.fileSizeBytes)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* View file in new tab */}
                                    <a
                                        href={`${BASE_URL}/admin/documents/${doc.id}/file`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-2xs font-bold px-3 py-1.5 rounded-lg border border-ink-black/20 text-ink-charcoal hover:bg-white transition"
                                    >
                                        👁 View
                                    </a>

                                    {doc.status !== 'ACCEPTED' && (
                                        <button
                                            type="button"
                                            onClick={() => handleDocAction(doc.id, 'ACCEPTED')}
                                            disabled={isActioning}
                                            className="text-2xs font-bold px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer transition disabled:opacity-50"
                                        >
                                            {isActioning ? '…' : '✓ Accept'}
                                        </button>
                                    )}
                                    {doc.status !== 'REJECTED' && (
                                        <button
                                            type="button"
                                            onClick={() => handleDocAction(doc.id, 'REJECTED')}
                                            disabled={isActioning}
                                            className="text-2xs font-bold px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer transition disabled:opacity-50"
                                        >
                                            {isActioning ? '…' : '✗ Reject'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main DoctorApprovalList page
// ─────────────────────────────────────────────────────────────────────────────
const DoctorApprovalList = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [expandedDocs, setExpandedDocs] = useState({}); // { [userId]: bool }
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [notesMap, setNotesMap] = useState({});

    const loadDoctors = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/pending');
            setDoctors(res.data.doctors || []);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to load pending doctor applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDoctors();
    }, []);

    const handleAction = async (userId, action) => {
        setActionLoading(userId);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await api.patch(`/admin/verify/${userId}`, {
                action,
                notes: notesMap[userId] || '',
            });
            const labels = {
                approve: 'approved ✓',
                reject: 'rejected',
                suspend: 'suspended',
                set_under_review: 'marked Under Review',
            };
            setSuccessMsg(`Doctor successfully ${labels[action] || action}.`);
            await loadDoctors();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || `Failed to ${action} doctor`);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleDocs = (userId) =>
        setExpandedDocs((prev) => ({ ...prev, [userId]: !prev[userId] }));

    const setNote = (userId, value) =>
        setNotesMap((prev) => ({ ...prev, [userId]: value }));

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            {/* Header */}
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-black text-ink-black font-heading">Doctor Registration Review</h2>
                    <p className="text-xs font-semibold text-ink-charcoal mt-1">
                        Review credentials, accept/reject documents, then approve or reject the doctor
                    </p>
                </div>
                <button
                    onClick={loadDoctors}
                    className="text-xs font-bold text-ink-muted hover:text-ink-black border border-ink-black/20 rounded-xl px-4 py-2 transition cursor-pointer"
                >
                    ↻ Refresh
                </button>
            </div>

            {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold rounded-xl">
                    ✓ {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-sm font-semibold rounded-xl">
                    ✗ {errorMsg}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-t-pastel-pink-action border-r-transparent border-b-cerulean border-l-transparent rounded-full animate-spin" />
                </div>
            ) : doctors.length === 0 ? (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-10 text-center">
                    <p className="text-4xl mb-3">🩺</p>
                    <p className="font-bold text-ink-black">No pending doctor applications</p>
                    <p className="text-xs text-ink-muted mt-1 font-medium">All registrations are up to date</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {doctors.map((doc) => {
                        const badge = VERIFY_STATUS_CONFIG[doc.verificationStatus] || { variant: 'warning', label: doc.verificationStatus };
                        const isActioning = actionLoading === doc.userId;
                        const docsExpanded = !!expandedDocs[doc.userId];

                        return (
                            <div key={doc.userId} className="bg-white border-2 border-ink-black rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-black text-ink-black">
                                                {doc.fullName || 'Unnamed Doctor'}
                                            </h3>
                                            <Badge variant={badge.variant}>{badge.label}</Badge>
                                        </div>
                                        <p className="text-xs text-ink-muted font-semibold">
                                            {doc.user?.email}{doc.user?.phone ? ` · ${doc.user.phone}` : ''}
                                        </p>
                                    </div>
                                    <p className="text-2xs text-ink-muted font-medium">
                                        Registered: {doc.user?.createdAt ? new Date(doc.user.createdAt).toLocaleDateString('en-IN') : '—'}
                                    </p>
                                </div>

                                {/* Profile details grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                    {[
                                        ['Specialization', doc.specialization],
                                        ['Qualification', doc.primaryMedicalQualification],
                                        ['Medical College', doc.medicalCollege],
                                        ['Reg. Number', doc.medicalRegistrationNumber],
                                        ['State Council', doc.stateMedicalCouncil],
                                        ['City', doc.city],
                                        ['Experience', doc.yearsOfExperience != null ? `${doc.yearsOfExperience} yr(s)` : null],
                                        ['Consultation Fee', doc.consultationFee != null ? `₹${doc.consultationFee}` : null],
                                        ['Clinic / Hospital', doc.clinicOrHospital],
                                    ]
                                        .filter(([, v]) => v)
                                        .map(([label, value]) => (
                                            <div key={label} className="bg-cream-bg rounded-lg px-3 py-2.5">
                                                <p className="text-ink-muted font-semibold uppercase tracking-wide text-2xs">{label}</p>
                                                <p className="text-ink-black font-bold mt-0.5">{value}</p>
                                            </div>
                                        ))}
                                </div>

                                {/* Documents toggle */}
                                <button
                                    type="button"
                                    onClick={() => toggleDocs(doc.userId)}
                                    className="self-start text-xs font-bold text-ink-charcoal border border-ink-black/20 rounded-xl px-4 py-1.5 hover:bg-cream-bg transition cursor-pointer"
                                >
                                    {docsExpanded ? '▲ Hide Documents' : '▼ View Documents'}
                                </button>

                                <DocumentsSection userId={doc.userId} expanded={docsExpanded} />

                                {/* Admin notes */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                        Admin Notes <span className="font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={notesMap[doc.userId] || ''}
                                        onChange={(e) => setNote(doc.userId, e.target.value)}
                                        placeholder="Reason for approval / rejection…"
                                        className="border-2 border-ink-black/20 focus:border-ink-black outline-none rounded-xl px-3 py-2 text-xs font-semibold text-ink-black placeholder:font-medium placeholder:text-ink-muted transition"
                                    />
                                </div>

                                {/* Overall action buttons */}
                                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-ink-black/10">
                                    <Button onClick={() => handleAction(doc.userId, 'approve')} variant="primary" className="!px-4 !py-2 !text-xs" disabled={isActioning}>
                                        {isActioning ? '…' : '✓ Approve Doctor'}
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(doc.userId, 'set_under_review')}
                                        variant="secondary"
                                        className="!px-4 !py-2 !text-xs !bg-amber-50 !border-amber-400 !text-amber-800 hover:!bg-amber-100"
                                        disabled={isActioning}
                                    >
                                        {isActioning ? '…' : '⟳ Under Review'}
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(doc.userId, 'reject')}
                                        variant="secondary"
                                        className="!px-4 !py-2 !text-xs !bg-red-50 !border-red-300 !text-red-700 hover:!bg-red-100"
                                        disabled={isActioning}
                                    >
                                        {isActioning ? '…' : '✗ Reject Doctor'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DoctorApprovalList;
