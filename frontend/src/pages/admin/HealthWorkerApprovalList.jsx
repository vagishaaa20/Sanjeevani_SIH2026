import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const HealthWorkerApprovalList = () => {
    const [healthWorkers, setHealthWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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
            // Reload list
            await loadHealthWorkers();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || err.message || 'Failed to process verification');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-black text-ink-black font-heading">Health Worker Approvals</h2>
                <p className="text-xs font-semibold text-ink-charcoal mt-1">Review pending health worker registrations and toggle verification flags</p>
            </div>

            {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold rounded-xl animate-fade-in-up">
                    {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-sm font-semibold rounded-xl animate-fade-in-up">
                    {errorMsg}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-t-pastel-pink-action border-r-transparent border-b-cerulean border-l-transparent rounded-full animate-spin"></div>
                </div>
            ) : healthWorkers.length === 0 ? (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-8 text-center">
                    <p className="font-semibold text-ink-muted">No pending health worker applications found.</p>
                </div>
            ) : (
                <Table headers={['Name', 'Worker Type', 'City / Location', 'Contact', 'Status', 'Actions']}>
                    {healthWorkers.map((hw) => (
                        <tr key={hw.userId} className="hover:bg-cream-bg/50">
                            <td className="px-5 py-4 font-bold text-ink-black">{hw.name}</td>
                            <td className="px-5 py-4 font-semibold text-ink-charcoal">
                                <span className="px-2 py-0.5 text-2xs font-semibold rounded-md bg-cream-surface border border-ink-black/10 uppercase">
                                    {hw.workerType?.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-ink-muted text-sm font-medium">{hw.district || 'Not specified'}</td>
                            <td className="px-5 py-4 text-ink-muted text-sm">
                                {hw.user?.phone || 'N/A'}<br />
                                <span className="text-xs opacity-70">{hw.user?.email}</span>
                            </td>
                            <td className="px-5 py-4">
                                <Badge variant="warning">PENDING</Badge>
                            </td>
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleAction(hw.userId, 'approve')}
                                        variant="primary"
                                        className="!px-3 !py-1 !text-xs"
                                        disabled={actionLoading}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(hw.userId, 'reject')}
                                        variant="secondary"
                                        className="!px-3 !py-1 !text-xs !bg-cream-surface"
                                        disabled={actionLoading}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Table>
            )}
        </div>
    );
};

export default HealthWorkerApprovalList;
