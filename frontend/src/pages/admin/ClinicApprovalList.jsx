import React, { useEffect, useState } from 'react';
import useClinic from '../../hooks/useClinic';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const ClinicApprovalList = () => {
    const { getPendingClinics, verifyClinic, loading, error } = useClinic();
    const [clinics, setClinics] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const loadClinics = async () => {
        try {
            const pendingList = await getPendingClinics();
            setClinics(pendingList);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to load clinic applications');
        }
    };

    useEffect(() => {
        loadClinics();
    }, []);

    const handleAction = async (id, status) => {
        setActionLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            await verifyClinic(id, status);
            setSuccessMsg(`Clinic application successfully ${status.toLowerCase()}!`);
            // Reload list
            await loadClinics();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to process clinic verification');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-black text-ink-black font-heading">Clinic Audit Approvals</h2>
                <p className="text-xs font-semibold text-ink-charcoal mt-1">Review pending registry registrations and toggle verification flags</p>
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
            ) : clinics.length === 0 ? (
                <div className="bg-white border-2 border-ink-black rounded-2xl p-8 text-center">
                    <p className="font-semibold text-ink-muted">No pending clinic registration applications found.</p>
                </div>
            ) : (
                <Table headers={['Clinic Name', 'License Number', 'City', 'Departments', 'Status', 'Actions']}>
                    {clinics.map((clinic) => (
                        <tr key={clinic.userId} className="hover:bg-cream-bg/50">
                            <td className="px-5 py-4 font-bold text-ink-black">{clinic.clinicName}</td>
                            <td className="px-5 py-4 font-semibold text-ink-charcoal">{clinic.licenseNumber}</td>
                            <td className="px-5 py-4 text-ink-muted text-sm font-medium">{clinic.city}</td>
                            <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {clinic.departments.map((d) => (
                                        <span key={d} className="px-2 py-0.5 text-2xs font-semibold rounded-md bg-cream-surface border border-ink-black/10">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <Badge variant="warning">PENDING</Badge>
                            </td>
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleAction(clinic.userId, 'VERIFIED')}
                                        variant="primary"
                                        className="!px-3 !py-1 !text-xs"
                                        disabled={actionLoading}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(clinic.userId, 'REJECTED')}
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

export default ClinicApprovalList;
