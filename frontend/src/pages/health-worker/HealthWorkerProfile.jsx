import React, { useEffect, useState, useRef } from 'react';
import {
    User,
    ShieldCheck,
    FileText,
    UploadCloud,
    Eye,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import healthWorkerService from '../../services/healthWorkerService';
import Badge from '../../components/common/Badge';

const HW_DOC_TYPES = [
    { value: 'COMMUNITY_HEALTH_CERTIFICATE', label: 'ASHA / ANM / Community Training Certificate' },
    { value: 'GOVERNMENT_IDENTITY', label: 'Government Identity (Aadhar / PAN / Voter ID)' },
    { value: 'ANM_ASHA_REGISTRATION', label: 'State Health Mission Registration Proof' },
];

const STATUS_CONFIG = {
    PENDING: { variant: 'warning', label: 'Pending Review' },
    APPROVED: { variant: 'success', label: 'Approved' },
    ACCEPTED: { variant: 'success', label: 'Approved' },
    REJECTED: { variant: 'error', label: 'Rejected' },
    RESUBMISSION_REQUIRED: { variant: 'warning', label: 'Resubmission Required' },
};

const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const HealthWorkerProfile = () => {
    const { user, refreshProfile } = useAuth();
    const [form, setForm] = useState({ name: '', phone: '', workerType: 'COMMUNITY_WORKER', district: '' });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);

    // Document state
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [docType, setDocType] = useState(HW_DOC_TYPES[0].value);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Preview
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewSignedUrl, setPreviewSignedUrl] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        setForm({
            name: user?.profile?.name || '',
            phone: user?.phone || '',
            workerType: user?.profile?.workerType || 'COMMUNITY_WORKER',
            district: user?.profile?.district || '',
        });
        loadDocuments();
    }, [user]);

    const loadDocuments = async () => {
        try {
            const res = await api.get('/documents/me');
            setDocuments(res.data.documents || []);
        } catch (err) {
            console.error('Failed to load documents', err);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await healthWorkerService.updateProfile(form);
            if (refreshProfile) await refreshProfile();
            setMessage({ type: 'success', text: 'Profile details saved successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Could not update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                setMessage({ type: 'error', text: 'Only PDF documents are accepted for verification.' });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File exceeds 10 MB maximum size limit.' });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setMessage({ type: '', text: '' });
            setSelectedFile(file);
        }
    };

    const handleUploadDoc = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;
        setUploading(true);
        setMessage({ type: '', text: '' });
        try {
            const formData = new FormData();
            formData.append('document', selectedFile);
            formData.append('documentType', docType);
            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessage({ type: 'success', text: 'Verification document uploaded securely to private storage.' });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            await loadDocuments();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to upload verification document.' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDoc = async (docId) => {
        try {
            await api.delete(`/documents/${docId}`);
            setMessage({ type: 'success', text: 'Document deleted.' });
            await loadDocuments();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete document.' });
        }
    };

    const handleViewDoc = async (doc) => {
        setPreviewDoc(doc);
        setPreviewSignedUrl(null);
        setPreviewLoading(true);
        try {
            const res = await api.get(`/documents/${doc.id}/signed-url`);
            setPreviewSignedUrl(res.data.signedUrl);
        } catch {
            setMessage({ type: 'error', text: 'Failed to retrieve secure preview.' });
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left max-w-5xl mx-auto pb-16 animate-fade-in-up">
            {/* Header */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68]">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl md:text-3xl font-black text-[#1c1218] font-heading">
                                Health Worker Profile & Verification
                            </h2>
                            <Badge variant={user?.isVerified ? 'success' : 'warning'}>
                                {user?.isVerified ? 'VERIFIED' : 'PENDING AUDIT'}
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-[#7d6974] mt-0.5">
                            Manage your frontline credentials, assigned district, and verification documents.
                        </p>
                    </div>
                </div>
            </div>

            {message.text && (
                <div
                    className={`p-4 rounded-2xl border text-xs font-bold animate-fade-in flex items-center gap-2 ${
                        message.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Profile Form */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
                <div className="border-b border-[#f5e4ec] pb-3">
                    <h3 className="text-base font-black text-[#1c1218] font-heading">Worker Details</h3>
                </div>

                <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#7d6974]">
                            Full Name <span className="text-[#e13b68]">*</span>
                        </label>
                        <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="border border-[#f5e4ec] focus:border-[#e13b68] focus:ring-2 focus:ring-[#e13b68]/20 outline-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1c1218] bg-[#fffafc]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#7d6974]">
                            Phone Number
                        </label>
                        <input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="border border-[#f5e4ec] focus:border-[#e13b68] focus:ring-2 focus:ring-[#e13b68]/20 outline-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1c1218] bg-[#fffafc]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#7d6974]">
                            Worker Type
                        </label>
                        <select
                            value={form.workerType}
                            onChange={(e) => setForm({ ...form, workerType: e.target.value })}
                            className="border border-[#f5e4ec] focus:border-[#e13b68] focus:ring-2 focus:ring-[#e13b68]/20 outline-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1c1218] bg-[#fffafc] cursor-pointer"
                        >
                            <option value="ASHA">ASHA (Accredited Social Health Activist)</option>
                            <option value="ANM">ANM (Auxiliary Nurse Midwife)</option>
                            <option value="COMMUNITY_WORKER">Community Health Worker</option>
                            <option value="OTHER">Other Frontline Practitioner</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#7d6974]">
                            Assigned District / City
                        </label>
                        <input
                            value={form.district}
                            onChange={(e) => setForm({ ...form, district: e.target.value })}
                            placeholder="e.g. Jamshedpur"
                            className="border border-[#f5e4ec] focus:border-[#e13b68] focus:ring-2 focus:ring-[#e13b68]/20 outline-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1c1218] bg-[#fffafc]"
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-black transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Document Upload & Verification Section */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
                <div className="border-b border-[#f5e4ec] pb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black text-[#1c1218] font-heading">
                            Verification Documents (PDF)
                        </h3>
                        <p className="text-xs text-[#7d6974] font-medium mt-0.5">
                            Upload your government identity and health mission credentials to receive verified status.
                        </p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#e13b68]" />
                </div>

                <form onSubmit={handleUploadDoc} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#7d6974]">
                            Document Type
                        </label>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="border border-[#f5e4ec] focus:border-[#e13b68] outline-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1c1218] bg-[#fffafc] cursor-pointer"
                        >
                            {HW_DOC_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#7d6974]">
                            Select PDF File
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            className="border border-[#f5e4ec] file:mr-3 file:py-2 file:px-3.5 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#ffe6ee] file:text-[#e13b68] file:cursor-pointer rounded-2xl p-1.5 text-xs font-semibold text-[#7d6974] bg-[#fffafc] cursor-pointer"
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={uploading || !selectedFile}
                            className="px-6 py-2.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-black transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4" />
                                    <span>Upload Verification PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Document List */}
                <div className="flex flex-col gap-3 pt-3 border-t border-[#fdf0f4]">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#7d6974]">
                        Uploaded Verification Documents ({documents.length})
                    </h4>

                    {loadingDocs ? (
                        <div className="py-6 flex justify-center">
                            <Loader2 className="w-6 h-6 text-[#e13b68] animate-spin" />
                        </div>
                    ) : documents.length === 0 ? (
                        <p className="text-xs text-[#7d6974] italic">No verification documents uploaded yet.</p>
                    ) : (
                        documents.map((doc) => {
                            const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDING;
                            const typeLabel =
                                HW_DOC_TYPES.find((t) => t.value === doc.documentType)?.label ||
                                doc.documentType?.replace(/_/g, ' ');

                            return (
                                <div
                                    key={doc.id}
                                    className="p-4 rounded-2xl bg-[#fffafc] border border-[#f5e4ec] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68]">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-xs text-[#1c1218]">{typeLabel}</span>
                                                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                                            </div>
                                            <span className="text-[11px] text-[#7d6974]">
                                                {doc.fileName} · {formatBytes(doc.fileSize)} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                                            </span>
                                            {doc.rejectionReason && (
                                                <p className="text-[11px] font-bold text-rose-700 mt-0.5">
                                                    Feedback: {doc.rejectionReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => handleViewDoc(doc)}
                                            className="px-3 py-1.5 rounded-full bg-white border border-[#f5e4ec] hover:border-[#f8c8d8] text-xs font-bold text-[#e13b68] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>View PDF</span>
                                        </button>

                                        {doc.status !== 'APPROVED' && doc.status !== 'ACCEPTED' && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDoc(doc.id)}
                                                className="p-1.5 text-[#7d6974] hover:text-rose-600 cursor-pointer"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Health Worker PDF Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-[#f5e4ec] rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f5e4ec] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#e13b68]" />
                                <h3 className="font-black text-base text-[#1c1218]">
                                    {HW_DOC_TYPES.find((t) => t.value === previewDoc.documentType)?.label || previewDoc.fileName}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewDoc(null)}
                                className="px-3 py-1 rounded-full bg-[#fdf5f7] text-xs font-bold text-[#7d6974] hover:text-[#e13b68] cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                        <div className="flex-1 bg-[#f5ecf0] flex items-center justify-center">
                            {previewLoading ? (
                                <Loader2 className="w-6 h-6 text-[#e13b68] animate-spin" />
                            ) : previewSignedUrl ? (
                                <iframe
                                    src={`${previewSignedUrl}#toolbar=1`}
                                    title="Health Worker Document"
                                    className="w-full h-full border-none bg-white"
                                />
                            ) : (
                                <p className="text-xs text-rose-600 font-bold">Failed to load preview.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthWorkerProfile;