import React, { useEffect, useState, useRef } from 'react';
import {
    FileText,
    UploadCloud,
    Eye,
    Trash2,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    X,
    ExternalLink,
    Loader2
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';

const DOCUMENT_TYPES = [
    { value: 'MEDICAL_REGISTRATION_CERTIFICATE', label: 'Medical Registration Certificate' },
    { value: 'MBBS_OR_PRIMARY_QUALIFICATION', label: 'MBBS / Primary Qualification' },
    { value: 'INTERNSHIP_COMPLETION_CERTIFICATE', label: 'Internship Completion Certificate' },
    { value: 'GOVERNMENT_IDENTITY', label: 'Government Identity (Aadhar / PAN)' },
    { value: 'PROFESSIONAL_PHOTOGRAPH', label: 'Professional Photograph' },
    { value: 'PG_QUALIFICATION_CERTIFICATE', label: 'PG Qualification Certificate' },
    { value: 'ADDITIONAL_QUALIFICATION_PROOF', label: 'Additional Qualification Proof' },
    { value: 'COLLEGE_OR_INSTITUTION_ID', label: 'College / Institution ID' },
    { value: 'RESIDENCY_PROOF', label: 'Residency Proof' },
    { value: 'INTERNSHIP_PROOF', label: 'Internship Proof' },
    { value: 'SPECIALIZATION_PROOF', label: 'Specialization Proof' },
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

export const DocumentUpload = () => {
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Upload form state
    const [docType, setDocType] = useState(DOCUMENT_TYPES[0].value);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Preview modal state
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewSignedUrl, setPreviewSignedUrl] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const clearMessages = () => {
        setSuccessMsg('');
        setErrorMsg('');
    };

    const loadDocuments = async () => {
        try {
            const res = await api.get('/documents/me');
            setDocuments(res.data.documents || []);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to load documents');
        } finally {
            setLoadingDocs(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                setErrorMsg('Only PDF files are permitted for verification.');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setErrorMsg('File size exceeds the 10 MB limit.');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            clearMessages();
            setSelectedFile(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setErrorMsg('Please select a valid PDF file to upload.');
            return;
        }
        clearMessages();
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('document', selectedFile);
            formData.append('documentType', docType);
            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccessMsg('Verification document uploaded securely to private storage. Awaiting admin review.');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            await loadDocuments();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Upload failed. Ensure the file is a valid PDF under 10 MB.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        clearMessages();
        setDeleting(docId);
        try {
            await api.delete(`/documents/${docId}`);
            setSuccessMsg('Document removed successfully.');
            await loadDocuments();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to delete document.');
        } finally {
            setDeleting(null);
        }
    };

    const handleViewDocument = async (doc) => {
        setPreviewDoc(doc);
        setPreviewSignedUrl(null);
        setPreviewLoading(true);
        try {
            const res = await api.get(`/documents/${doc.id}/signed-url`);
            setPreviewSignedUrl(res.data.signedUrl);
        } catch (err) {
            setErrorMsg('Failed to generate secure preview URL.');
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left max-w-5xl mx-auto pb-16 animate-fade-in-up">
            {/* Header */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68]">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-[#1c1218] font-heading">
                            Professional Verification Documents
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-[#7d6974] mt-0.5">
                            Upload your medical registration and academic certificates for admin verification.
                        </p>
                    </div>
                </div>
            </div>

            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-fade-in flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl animate-fade-in flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Upload Form Card */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-[#f5e4ec] pb-3">
                    <UploadCloud className="w-5 h-5 text-[#e13b68]" />
                    <h3 className="text-base font-black text-[#1c1218] font-heading">
                        Upload Verification PDF
                    </h3>
                </div>

                <form onSubmit={handleUpload} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black text-[#7d6974] uppercase tracking-wider">
                                Document Type <span className="text-[#e13b68]">*</span>
                            </label>
                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                className="border border-[#f5e4ec] focus:border-[#e13b68] focus:ring-2 focus:ring-[#e13b68]/20 outline-none rounded-2xl px-4 py-3 text-xs font-bold text-[#1c1218] transition bg-[#fffafc] cursor-pointer"
                            >
                                {DOCUMENT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black text-[#7d6974] uppercase tracking-wider">
                                PDF Document File <span className="text-[#e13b68]">*</span>
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileChange}
                                className="border border-[#f5e4ec] file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#ffe6ee] file:text-[#e13b68] hover:file:bg-[#ffd6e2] file:cursor-pointer rounded-2xl p-2 text-xs font-semibold text-[#7d6974] bg-[#fffafc] cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-[11px] font-medium text-[#7d6974]">
                            Strict PDF format only · Maximum file size 10 MB · Stored in private encrypted bucket.
                        </p>
                        <button
                            type="submit"
                            disabled={uploading || !selectedFile}
                            className="px-6 py-3 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-black transition shadow-md disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Encrypting & Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4" />
                                    <span>Upload Document</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Uploaded Documents List */}
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#f5e4ec] pb-3">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#e13b68]" />
                        <h3 className="text-base font-black text-[#1c1218] font-heading">
                            Submitted Documents
                        </h3>
                    </div>
                    <span className="text-xs font-bold text-[#7d6974]">
                        {documents.length} Uploaded
                    </span>
                </div>

                {loadingDocs ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-[#e13b68] animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center gap-2 text-[#7d6974]">
                        <FileText className="w-8 h-8 text-[#f8c8d8]" />
                        <p className="text-xs font-bold">No documents submitted yet.</p>
                        <p className="text-[11px]">Upload your medical registration and certificates above to complete verification.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {documents.map((doc) => {
                            const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDING;
                            const typeLabel =
                                DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label ||
                                doc.documentType?.replace(/_/g, ' ');

                            return (
                                <div
                                    key={doc.id}
                                    className="p-4 sm:p-5 rounded-2xl bg-[#fffafc] border border-[#f5e4ec] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-2xs hover:border-[#f8c8d8]"
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68] shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-xs sm:text-sm font-black text-[#1c1218]">
                                                    {typeLabel}
                                                </h4>
                                                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                                            </div>
                                            <p className="text-[11px] text-[#7d6974] font-medium">
                                                {doc.fileName} · {formatBytes(doc.fileSize)} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                                            </p>
                                            {doc.rejectionReason && (
                                                <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-800">
                                                    Admin Feedback: {doc.rejectionReason}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => handleViewDocument(doc)}
                                            className="px-3.5 py-1.5 rounded-full bg-white border border-[#f5e4ec] hover:border-[#f8c8d8] text-xs font-bold text-[#e13b68] transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>View PDF</span>
                                        </button>

                                        {doc.status !== 'APPROVED' && doc.status !== 'ACCEPTED' && (
                                            <button
                                                type="button"
                                                disabled={deleting === doc.id}
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-1.5 rounded-full hover:bg-rose-50 text-[#7d6974] hover:text-rose-600 transition cursor-pointer"
                                                title="Delete pending document"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Doctor PDF Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-[#f5e4ec] rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#f5e4ec] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#e13b68]" />
                                <h3 className="font-black text-base text-[#1c1218]">
                                    {DOCUMENT_TYPES.find((t) => t.value === previewDoc.documentType)?.label ||
                                        previewDoc.fileName}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {previewSignedUrl && (
                                    <a
                                        href={previewSignedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 rounded-full bg-[#fdf5f7] border border-[#f8c8d8] text-xs font-bold text-[#e13b68] flex items-center gap-1"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>Open Full Window</span>
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setPreviewDoc(null)}
                                    className="w-8 h-8 rounded-full bg-[#fdf5f7] text-[#7d6974] hover:text-[#e13b68] flex items-center justify-center cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-[#f5ecf0] relative flex items-center justify-center overflow-hidden">
                            {previewLoading ? (
                                <div className="flex items-center gap-2 text-xs font-bold text-[#7d6974]">
                                    <Loader2 className="w-5 h-5 text-[#e13b68] animate-spin" />
                                    <span>Retrieving encrypted document...</span>
                                </div>
                            ) : previewSignedUrl ? (
                                <iframe
                                    src={`${previewSignedUrl}#toolbar=1&navpanes=0`}
                                    title="Doctor Verification Document"
                                    className="w-full h-full border-none bg-white"
                                />
                            ) : (
                                <p className="text-xs font-bold text-rose-600">Failed to render PDF preview.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentUpload;
