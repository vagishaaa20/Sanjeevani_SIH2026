import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

// Document types the backend accepts
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
    ACCEPTED: { variant: 'success', label: 'Accepted' },
    REJECTED: { variant: 'error', label: 'Rejected' },
};

const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentUpload = () => {
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

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setErrorMsg('Please select a file to upload.');
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
            setSuccessMsg('Document uploaded successfully! It is now pending review by admin.');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            await loadDocuments();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Upload failed. Ensure file is PDF/JPG/PNG under 10 MB.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        clearMessages();
        setDeleting(docId);
        try {
            await api.delete(`/documents/${docId}`);
            setSuccessMsg('Document removed.');
            await loadDocuments();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to delete document');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            {/* Header */}
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-black text-ink-black font-heading">My Verification Documents</h2>
                <p className="text-xs font-semibold text-ink-charcoal mt-1">
                    Upload your credentials for admin verification. Accepted file types: PDF, JPG, PNG (max 10 MB).
                </p>
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

            {/* Upload Form */}
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-base font-black text-ink-black">Upload New Document</h3>
                <form onSubmit={handleUpload} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider">
                            Document Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="border-2 border-ink-black/20 focus:border-ink-black outline-none rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-black transition bg-white cursor-pointer"
                        >
                            {DOCUMENT_TYPES.map((dt) => (
                                <option key={dt.value} value={dt.value}>
                                    {dt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-2xs font-bold text-ink-muted uppercase tracking-wider">
                            File <span className="text-red-500">*</span>
                        </label>
                        <div
                            className="border-2 border-dashed border-ink-black/20 hover:border-ink-black rounded-xl px-4 py-6 text-center cursor-pointer transition"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {selectedFile ? (
                                <p className="text-sm font-semibold text-ink-black">
                                    📄 {selectedFile.name} <span className="text-ink-muted font-medium">({formatBytes(selectedFile.size)})</span>
                                </p>
                            ) : (
                                <p className="text-sm text-ink-muted font-semibold">Click to choose file or drag &amp; drop</p>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                        />
                    </div>

                    <Button type="submit" variant="primary" disabled={uploading || !selectedFile} className="self-start px-6">
                        {uploading ? 'Uploading…' : '⬆ Upload Document'}
                    </Button>
                </form>
            </div>

            {/* Existing Documents */}
            <div className="flex flex-col gap-3">
                <h3 className="text-base font-black text-ink-black">Submitted Documents</h3>

                {loadingDocs ? (
                    <div className="flex justify-center p-8">
                        <div className="w-7 h-7 border-4 border-t-pastel-pink-action border-r-transparent border-b-cerulean border-l-transparent rounded-full animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="bg-white border-2 border-ink-black rounded-2xl p-8 text-center">
                        <p className="text-3xl mb-2">📂</p>
                        <p className="font-bold text-ink-black">No documents uploaded yet</p>
                        <p className="text-xs text-ink-muted mt-1 font-medium">Use the form above to submit your first document</p>
                    </div>
                ) : (
                    documents.map((doc) => {
                        const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDING;
                        const friendlyType = DOCUMENT_TYPES.find((d) => d.value === doc.documentType)?.label || doc.documentType;
                        return (
                            <div
                                key={doc.id}
                                className="bg-white border-2 border-ink-black rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm"
                            >
                                <div className="flex flex-col gap-1 flex-grow">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-sm text-ink-black">{friendlyType}</p>
                                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                                    </div>
                                    <p className="text-xs text-ink-muted font-medium">
                                        {doc.originalFileName} · {formatBytes(doc.fileSizeBytes)} · {doc.mimeType}
                                    </p>
                                    {doc.status === 'REJECTED' && (
                                        <p className="text-xs text-red-600 font-semibold mt-1">
                                            ✗ Rejected — please re-upload a corrected document
                                        </p>
                                    )}
                                </div>
                                {doc.status !== 'ACCEPTED' && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deleting === doc.id}
                                        className="text-xs font-bold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 rounded-xl px-3 py-1.5 cursor-pointer transition disabled:opacity-50"
                                    >
                                        {deleting === doc.id ? '…' : 'Delete'}
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DocumentUpload;
