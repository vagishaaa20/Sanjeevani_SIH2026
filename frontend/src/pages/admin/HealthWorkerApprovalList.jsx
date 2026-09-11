import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AdminPdfViewerModal from '../../components/admin/AdminPdfViewerModal';
import { Eye, FileText, CheckCircle2, XCircle, Users } from 'lucide-react';

export const HealthWorkerApprovalList = () => {
    const [healthWorkers, setHealthWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const loadHealthWorkers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/pending');
            setHealthWorkers(data.healthWorkers || []);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || err.message || 'Failed to load health worker applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHealthWorkers();
    }, []);

    const handleAction = async (id, actionStr) => {
        setActionLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            await api.patch(`/admin/verify/${id}`, { action: actionStr });
            setSuccessMsg(`Health Worker application successfully ${actionStr === 'approve' ? 'approved' : 'rejected'}!`);
            await loadHealthWorkers();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || err.message || 'Failed to process verification');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left max-w-7xl mx-auto pb-12 animate-fade-in-up">
            <div className="bg-white border border-[#f5e4ec] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] border border-[#f8c8d8] flex items-center justify-center text-[#e13b68]">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#1c1218] font-heading">
                            Health Worker Approvals
                        </h2>
                        <p className="text-xs font-semibold text-[#7d6974] mt-0.5">
                            Review pending health worker registrations, verification credentials, and field assignments.
                        </p>
                    </div>
                </div>
            </div>

            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-fade-in">
                    {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl animate-fade-in">
                    {errorMsg}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12 bg-white rounded-3xl border border-[#f5e4ec]">
                    <div className="w-8 h-8 border-4 border-t-[#e13b68] border-r-transparent border-b-[#e13b68] border-l-transparent rounded-full animate-spin"></div>
                </div>
            ) : healthWorkers.length === 0 ? (
                <div className="bg-white border border-[#f5e4ec] rounded-3xl p-12 text-center shadow-xs">
                    <p className="font-bold text-xs text-[#7d6974]">No pending health worker applications found.</p>
                </div>
            ) : (
                <div className="bg-white border border-[#f5e4ec] rounded-3xl overflow-hidden shadow-xs">
                    <Table headers={['Name', 'Worker Type', 'Location', 'Contact', 'Verification Documents', 'Actions']}>
                        {healthWorkers.map((hw) => {
                            const docs = hw.user?.verificationDocuments || [];
                            return (
                                <tr key={hw.userId} className="hover:bg-[#fdf9fb] transition">
                                    <td className="px-5 py-4 font-black text-sm text-[#1c1218]">{hw.name}</td>
                                    <td className="px-5 py-4 font-semibold text-xs text-[#4a3c45]">
                                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-[#fdf0f4] border border-[#f8c8d8] text-[#e13b68] uppercase">
                                            {hw.workerType?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-[#7d6974] text-xs font-medium">{hw.district || 'Not specified'}</td>
                                    <td className="px-5 py-4 text-[#7d6974] text-xs font-medium">
                                        <span className="font-bold text-[#1c1218]">{hw.user?.phone || 'N/A'}</span>
                                        <br />
                                        <span className="text-[11px] opacity-70">{hw.user?.email}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {docs.length > 0 ? (
                                            <div className="flex flex-col gap-1.5">
                                                {docs.map((doc) => (
                                                    <button
                                                        key={doc.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedDoc(doc);
                                                            setSelectedUser({ name: hw.name, role: 'Health Worker' });
                                                        }}
                                                        className="self-start text-[11px] font-bold px-3 py-1 rounded-full bg-[#fdf5f7] border border-[#f8c8d8] text-[#e13b68] hover:bg-[#ffe6ee] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        <span>{doc.documentType?.replace(/_/g, ' ') || 'Document'}</span>
                                                        <Eye className="w-3 h-3 ml-0.5" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[#a895a0] italic font-medium">No PDFs attached</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => handleAction(hw.userId, 'approve')}
                                                variant="primary"
                                                className="!px-3.5 !py-1.5 !text-xs !bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 font-bold"
                                                disabled={actionLoading}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                onClick={() => handleAction(hw.userId, 'reject')}
                                                variant="secondary"
                                                className="!px-3.5 !py-1.5 !text-xs !text-rose-700 !border-rose-300 hover:!bg-rose-50 font-bold"
                                                disabled={actionLoading}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </Table>
                </div>
            )}

            {/* Admin PDF Viewer Modal */}
            {selectedDoc && (
                <AdminPdfViewerModal
                    isOpen={!!selectedDoc}
                    onClose={() => {
                        setSelectedDoc(null);
                        setSelectedUser(null);
                    }}
                    documentId={selectedDoc.id}
                    initialDoc={selectedDoc}
                    user={selectedUser || { role: 'Health Worker' }}
                    onActionSuccess={() => {
                        loadHealthWorkers();
                    }}
                />
            )}
        </div>
    );
};

export default HealthWorkerApprovalList;
