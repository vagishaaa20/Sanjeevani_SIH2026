import React, { useEffect, useState } from 'react';
import diagnosticService from '../../services/diagnosticService';
import DiagnosticStatusBadge from '../../components/diagnostic/DiagnosticStatusBadge';
import DiagnosticRequestForm from '../../components/diagnostic/DiagnosticRequestForm';
import healthWorkerService from '../../services/healthWorkerService';

export default function HealthWorkerDiagnostics() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [availablePatients, setAvailablePatients] = useState([]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await diagnosticService.getRequests();
            setRequests(data);
            
            const patientsData = await healthWorkerService.getPatients();
            // Depending on response structure (it might be data.patients or data directly)
            setAvailablePatients(patientsData.patients || patientsData || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load diagnostic requests or patients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    return (
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-ink-black">Diagnostic Coordination</h2>
                        <p className="text-sm font-semibold text-ink-charcoal">
                            Coordinate diagnostic tests for your assigned patients.
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="bg-pastel-pink-action text-white font-bold px-6 py-3 rounded-xl border border-ink-black shadow-[2px_2px_0px_#111] hover:-translate-y-0.5 transition-all text-sm"
                    >
                        {showForm ? 'Close Form' : 'New Request'}
                    </button>
                </div>
                
                {showForm && (
                    <div className="mt-4">
                        <DiagnosticRequestForm 
                            onSuccess={() => {
                                setShowForm(false);
                                fetchRequests();
                            }}
                            availablePatients={availablePatients} 
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <h3 className="font-black text-xl text-ink-black px-2">Recent Requests</h3>
                
                {loading && <p className="font-bold text-ink-charcoal animate-pulse px-2">Loading...</p>}
                {error && <p className="font-bold text-red-600 px-2">{error}</p>}
                
                {!loading && !error && requests.length === 0 && (
                    <div className="bg-white border-2 border-ink-black rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                        <h3 className="font-black text-xl text-ink-black mb-2">No Requests</h3>
                        <p className="text-sm text-ink-charcoal mb-6">
                            You have not coordinated any diagnostic requests yet.
                        </p>
                    </div>
                )}
                
                {!loading && !error && requests.map(req => (
                    <div key={req.id} className="bg-white border border-[#f5e4ec] rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-black text-lg text-ink-black tracking-wide">
                                {req.testName} <span className="text-sm text-ink-muted">({req.priority})</span>
                            </h3>
                            <p className="text-xs font-semibold text-ink-charcoal">
                                Patient: {req.patient?.email || req.patientId}
                            </p>
                            <p className="text-xs font-semibold text-ink-muted">
                                Requested: {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <DiagnosticStatusBadge status={req.status} />
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
