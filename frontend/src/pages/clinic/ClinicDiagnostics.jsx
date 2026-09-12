import React, { useEffect, useState, useContext } from 'react';
import diagnosticService from '../../services/diagnosticService';
import DiagnosticStatusBadge from '../../components/diagnostic/DiagnosticStatusBadge';
import { NotificationContext } from '../../context/NotificationContext';
import Button from '../../components/common/Button';

export default function ClinicDiagnostics() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addNotification } = useContext(NotificationContext);
    
    // Upload state
    const [uploadingId, setUploadingId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await diagnosticService.getRequests();
            setRequests(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load diagnostic requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await diagnosticService.updateStatus(id, { status: newStatus });
            addNotification(`Status updated to ${newStatus}`, 'success');
            fetchRequests();
        } catch (err) {
            addNotification(err.response?.data?.error || 'Failed to update status', 'error');
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUploadResult = async (id) => {
        if (!selectedFile) {
            addNotification('Please select a file to upload', 'error');
            return;
        }
        setUploadingId(id);
        try {
            await diagnosticService.uploadResult(id, selectedFile);
            addNotification('Result uploaded successfully', 'success');
            setSelectedFile(null);
            setUploadingId(null);
            fetchRequests();
        } catch (err) {
            addNotification(err.response?.data?.error || 'Failed to upload result', 'error');
            setUploadingId(null);
        }
    };

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    return (
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col gap-2 shadow-sm">
                <h2 className="text-3xl font-black text-ink-black">Diagnostic Coordination</h2>
                <p className="text-sm font-semibold text-ink-charcoal">
                    Manage incoming diagnostic requests, update their status, and upload results.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {loading && <p className="font-bold text-ink-charcoal animate-pulse px-2">Loading...</p>}
                {error && <p className="font-bold text-red-600 px-2">{error}</p>}
                
                {!loading && !error && requests.length === 0 && (
                    <div className="bg-white border-2 border-ink-black rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                        <h3 className="font-black text-xl text-ink-black mb-2">No Requests</h3>
                        <p className="text-sm text-ink-charcoal mb-6">
                            There are no incoming diagnostic requests for your facility.
                        </p>
                    </div>
                )}
                
                {!loading && !error && requests.map(req => (
                    <div key={req.id} className="bg-white border border-[#f5e4ec] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                        <div className="flex flex-col gap-1 flex-1">
                            <h3 className="font-black text-lg text-ink-black tracking-wide">
                                {req.testName} <span className="text-sm text-ink-muted">({req.priority})</span>
                            </h3>
                            <p className="text-xs font-semibold text-ink-charcoal">
                                Patient: {req.patient?.email || req.patientId}
                            </p>
                            <p className="text-xs font-semibold text-ink-charcoal">
                                Requested By: {req.requester?.email || req.requesterId}
                            </p>
                            {req.notes && (
                                <p className="text-xs text-ink-muted italic mt-1">
                                    Notes: {req.notes}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col items-end gap-3 min-w-[200px]">
                            <DiagnosticStatusBadge status={req.status} />
                            
                            {req.status === 'REQUESTED' && (
                                <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(req.id, 'SCHEDULED')}>
                                    Accept & Schedule
                                </Button>
                            )}
                            
                            {req.status === 'SCHEDULED' && (
                                <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(req.id, 'IN_PROGRESS')}>
                                    Mark In Progress
                                </Button>
                            )}

                            {['SCHEDULED', 'IN_PROGRESS'].includes(req.status) && (
                                <div className="flex flex-col gap-2 mt-2 w-full">
                                    <input 
                                        type="file" 
                                        accept=".pdf,.png,.jpg,.jpeg" 
                                        onChange={handleFileChange}
                                        className="text-xs border border-ink-black rounded p-1 w-full"
                                    />
                                    <Button 
                                        size="sm" 
                                        variant="primary" 
                                        disabled={uploadingId === req.id || !selectedFile}
                                        onClick={() => handleUploadResult(req.id)}
                                    >
                                        {uploadingId === req.id ? 'Uploading...' : 'Upload Result'}
                                    </Button>
                                </div>
                            )}

                            {req.resultDocumentUrl && (
                                <a 
                                    href={`${apiUrl}${req.resultDocumentUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-cerulean font-bold text-xs hover:underline mt-1"
                                >
                                    View Result
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
