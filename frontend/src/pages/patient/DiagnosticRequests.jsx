import React, { useEffect, useState } from 'react';
import diagnosticService from '../../services/diagnosticService';
import DiagnosticStatusBadge from '../../components/diagnostic/DiagnosticStatusBadge';

export default function DiagnosticRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRequests = async () => {
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
        fetchRequests();
    }, []);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 text-left">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 flex flex-col gap-2 shadow-sm">
                <h2 className="text-3xl font-black text-ink-black">My Diagnostic Tests</h2>
                <p className="text-sm font-semibold text-ink-charcoal">
                    View the status of your prescribed diagnostic tests and download results.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {loading && <p className="font-bold text-ink-charcoal animate-pulse">Loading...</p>}
                {error && <p className="font-bold text-red-600">{error}</p>}
                
                {!loading && !error && requests.length === 0 && (
                    <div className="bg-white border-2 border-ink-black rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                        <span className="text-4xl mb-4">🧪</span>
                        <h3 className="font-black text-xl text-ink-black mb-2">No Diagnostic Tests</h3>
                        <p className="text-sm text-ink-charcoal mb-6">
                            You do not have any diagnostic test requests at the moment.
                        </p>
                    </div>
                )}
                
                {!loading && !error && requests.map(req => (
                    <div key={req.id} className="bg-white border-2 border-ink-black rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-black text-lg text-ink-black tracking-wide">
                                {req.testName}
                            </h3>
                            <p className="text-xs font-semibold text-ink-charcoal">
                                Requested on: {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                            {req.scheduledDate && (
                                <p className="text-xs font-semibold text-emerald-600">
                                    Scheduled: {new Date(req.scheduledDate).toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <DiagnosticStatusBadge status={req.status} />
                            {req.resultDocumentUrl && (
                                <a 
                                    href={`${apiUrl}${req.resultDocumentUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-cerulean text-white font-bold px-3 py-1.5 rounded-xl border border-ink-black shadow-[2px_2px_0px_#111] hover:-translate-y-0.5 transition-all text-xs"
                                >
                                    Download Result
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
