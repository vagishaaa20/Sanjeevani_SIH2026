import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RotateCcw,
    FileText,
    ShieldCheck,
    User,
    Calendar,
    HardDrive,
    ExternalLink,
    Loader2,
    ZoomIn,
    Sparkles
} from 'lucide-react';
import api from '../../services/api';

const DOCUMENT_TYPE_LABELS = {
    MEDICAL_REGISTRATION_CERTIFICATE: 'Medical Registration Certificate',
    MBBS_OR_PRIMARY_QUALIFICATION: 'MBBS / Primary Qualification',
    INTERNSHIP_COMPLETION_CERTIFICATE: 'Internship Completion Certificate',
    GOVERNMENT_IDENTITY: 'Government Identity (Aadhar / PAN)',
    PROFESSIONAL_PHOTOGRAPH: 'Professional Photograph',
    PG_QUALIFICATION_CERTIFICATE: 'PG Qualification Certificate',
    ADDITIONAL_QUALIFICATION_PROOF: 'Additional Qualification Proof',
    COLLEGE_OR_INSTITUTION_ID: 'College / Institution ID',
    RESIDENCY_PROOF: 'Residency Proof',
    INTERNSHIP_PROOF: 'Internship Proof',
    SPECIALIZATION_PROOF: 'Specialization Proof',
    COMMUNITY_HEALTH_CERTIFICATE: 'Community Health Worker Certificate',
    ANM_ASHA_REGISTRATION: 'ANM / ASHA State Registration',
};

const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AdminPdfViewerModal = ({
    isOpen,
    onClose,
    documentId,
    initialDoc = {},
    user = {},
    onActionSuccess,
}) => {
    const [signedUrl, setSignedUrl] = useState(null);
    const [docDetails, setDocDetails] = useState(initialDoc);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

    // Rejection / Resubmission reason modal state
    const [actionType, setActionType] = useState(null); // 'REJECTED' | 'RESUBMISSION_REQUIRED'
    const [reasonText, setReasonText] = useState('');

    useEffect(() => {
        if (!isOpen || !documentId) return;

        setLoading(true);
        setError('');
        setSignedUrl(null);
        setActionMsg({ type: '', text: '' });
        setActionType(null);
        setReasonText('');

        api.get(`/admin/documents/${documentId}/signed-url`)
            .then((res) => {
                setSignedUrl(res.data.signedUrl);
                if (res.data.document) {
                    setDocDetails((prev) => ({ ...prev, ...res.data.document }));
                }
            })
            .catch((err) => {
                console.error('[AdminPdfViewer] error:', err);
                setError(err.response?.data?.error || 'Failed to generate secure signed URL for this document.');
            })
            .finally(() => setLoading(false));
    }, [isOpen, documentId]);

    if (!isOpen) return null;

    const handleAction = async (status, rejectionReason = '') => {
        setActionLoading(true);
        setActionMsg({ type: '', text: '' });
        try {
            await api.patch(`/admin/documents/${documentId}`, {
                status,
                rejectionReason,
            });
            setDocDetails((prev) => ({ ...prev, status, rejectionReason }));
            setActionMsg({
                type: 'success',
                text: `Document successfully marked as ${status.replace('_', ' ')}.`,
            });
            setActionType(null);
            setReasonText('');
            if (onActionSuccess) onActionSuccess(documentId, status);
        } catch (err) {
            setActionMsg({
                type: 'error',
                text: err.response?.data?.error || 'Failed to update document status.',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const docTypeLabel =
        DOCUMENT_TYPE_LABELS[docDetails.documentType] ||
        docDetails.documentType?.replace(/_/g, ' ') ||
        'Verification Document';

    const statusBadgeColors = {
        APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        ACCEPTED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
        RESUBMISSION_REQUIRED: 'bg-amber-50 text-amber-800 border-amber-200',
        PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div className="bg-[#fffcfd] border border-[#f5e4ec] rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="bg-white border-b border-[#f5e4ec] px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68]">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black text-[#1c1218] font-heading">
                                    {docTypeLabel}
                                </h3>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                        statusBadgeColors[docDetails.status] || statusBadgeColors.PENDING
                                    }`}
                                >
                                    {docDetails.status || 'PENDING'}
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-[#7d6974]">
                                Applicant: {user.name || user.email || 'Healthcare Professional'} ({docDetails.role || user.role || 'Doctor'})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {signedUrl && (
                            <a
                                href={signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 rounded-full bg-[#fdf5f7] border border-[#f5e4ec] hover:border-[#f8c8d8] text-xs font-bold text-[#e13b68] transition flex items-center gap-1.5 shadow-2xs"
                                title="Open full PDF in dedicated browser tab"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Open in Tab</span>
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-[#fdf5f7] hover:bg-[#ffe6ee] text-[#7d6974] hover:text-[#e13b68] flex items-center justify-center transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area: PDF Viewer + Metadata Sidebar */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* PDF Viewer Frame */}
                    <div className="flex-1 bg-[#f0e6eb] relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-[#f5e4ec]">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3 text-xs font-bold text-[#7d6974] p-8">
                                <Loader2 className="w-8 h-8 text-[#e13b68] animate-spin" />
                                <span>Generating temporary secure signed URL...</span>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center max-w-md bg-white rounded-2xl border border-rose-200 shadow-md">
                                <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
                                <h4 className="font-black text-sm text-rose-950">Could Not Load Document</h4>
                                <p className="text-xs text-rose-800 mt-1">{error}</p>
                            </div>
                        ) : signedUrl ? (
                            <iframe
                                src={`${signedUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                title="Original Verification PDF Document"
                                className="w-full h-full border-none bg-white"
                            />
                        ) : null}
                    </div>

                    {/* Metadata & Review Actions Sidebar */}
                    <div className="w-full lg:w-80 bg-[#fffcfd] p-6 flex flex-col justify-between overflow-y-auto shrink-0 gap-6">
                        <div className="flex flex-col gap-5">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#7d6974] border-b border-[#f5e4ec] pb-2">
                                Document Metadata
                            </h4>

                            <div className="flex flex-col gap-3 text-xs">
                                <div className="flex items-start gap-2.5">
                                    <User className="w-4 h-4 text-[#e13b68] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#1c1218]">Applicant</p>
                                        <p className="text-[#7d6974]">{user.name || user.email || '—'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <FileText className="w-4 h-4 text-[#e13b68] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#1c1218]">Original Filename</p>
                                        <p className="text-[#7d6974] truncate max-w-[200px]" title={docDetails.fileName}>
                                            {docDetails.fileName || 'document.pdf'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Calendar className="w-4 h-4 text-[#e13b68] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#1c1218]">Submission Date</p>
                                        <p className="text-[#7d6974]">
                                            {docDetails.uploadedAt
                                                ? new Date(docDetails.uploadedAt).toLocaleString('en-IN', {
                                                      dateStyle: 'medium',
                                                      timeStyle: 'short',
                                                  })
                                                : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <HardDrive className="w-4 h-4 text-[#e13b68] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#1c1218]">File Size & Format</p>
                                        <p className="text-[#7d6974]">
                                            {formatBytes(docDetails.fileSize)} • PDF
                                        </p>
                                    </div>
                                </div>

                                {docDetails.rejectionReason && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                                        <p className="font-black text-rose-900 text-[11px] uppercase">Rejection Reason</p>
                                        <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                                            {docDetails.rejectionReason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Toast status alert */}
                            {actionMsg.text && (
                                <div
                                    className={`p-3 rounded-2xl border text-xs font-bold animate-fade-in ${
                                        actionMsg.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : 'bg-rose-50 text-rose-800 border-rose-200'
                                    }`}
                                >
                                    {actionMsg.text}
                                </div>
                            )}

                            {/* Prompt Reason for Rejection / Resubmission */}
                            {actionType && (
                                <div className="p-4 bg-[#fff5f8] border border-[#f8c8d8] rounded-2xl flex flex-col gap-2.5 animate-fade-in">
                                    <p className="text-xs font-black text-[#e13b68]">
                                        {actionType === 'REJECTED'
                                            ? 'Provide Rejection Reason'
                                            : 'Specify Required Resubmission Details'}
                                    </p>
                                    <textarea
                                        value={reasonText}
                                        onChange={(e) => setReasonText(e.target.value)}
                                        placeholder={
                                            actionType === 'REJECTED'
                                                ? 'e.g. Illegible registration certificate, expired council seal...'
                                                : 'e.g. Please upload clear front and back scan of your state council ID...'
                                        }
                                        rows={3}
                                        required
                                        className="w-full p-2.5 rounded-xl border border-[#f0d5df] text-xs focus:outline-none focus:ring-2 focus:ring-[#e13b68]/20 bg-white"
                                    />
                                    <div className="flex items-center gap-2 justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setActionType(null)}
                                            className="px-3 py-1.5 rounded-full text-xs font-bold text-[#7d6974] hover:bg-white transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionLoading || !reasonText.trim()}
                                            onClick={() => handleAction(actionType, reasonText)}
                                            className="px-4 py-1.5 rounded-full bg-[#e13b68] hover:bg-[#c92a55] text-white text-xs font-black transition disabled:opacity-50"
                                        >
                                            {actionLoading ? 'Saving...' : 'Confirm Action'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Review Action Buttons */}
                        {!actionType && (
                            <div className="flex flex-col gap-2.5 border-t border-[#f5e4ec] pt-4">
                                <button
                                    type="button"
                                    disabled={actionLoading || docDetails.status === 'APPROVED' || docDetails.status === 'ACCEPTED'}
                                    onClick={() => handleAction('APPROVED')}
                                    className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Approve Document</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setActionType('RESUBMISSION_REQUIRED')}
                                    className="w-full py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Request Resubmission</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={actionLoading || docDetails.status === 'REJECTED'}
                                    onClick={() => setActionType('REJECTED')}
                                    className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Reject Document</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPdfViewerModal;
