import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function PreCallDocumentSubmit({ consultationId }) {
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [fileUrl, setFileUrl] = useState('');
    const [documentType, setDocumentType] = useState('other');
    const navigate = useNavigate();

    const handleSkip = () => {
        navigate(`/patient/consultation/${consultationId}/room`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fileUrl.trim()) return;

        setStatus('loading');
        try {
            await api.post(`/consultations/${consultationId}/documents`, {
                fileUrl,
                documentType
            });
            setStatus('success');
            setTimeout(() => {
                navigate(`/patient/consultation/${consultationId}/room`);
            }, 1000);
        } catch (err) {
            console.error('Upload failed', err);
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border-2 border-ink-black rounded-3xl p-8 w-full max-w-lg shadow-2xl flex flex-col gap-6 relative animate-scale-in">

                <div className="text-center">
                    <h2 className="text-2xl font-black text-ink-black">Submit Documents</h2>
                    <p className="text-sm font-semibold text-ink-charcoal mt-1">
                        Doctor is ready! Optional: add prior prescriptions, lab reports, or photos for the doctor.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-ink-charcoal uppercase tracking-wider">Document Type</label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="p-3 border-2 border-ink-black rounded-xl bg-stone-50 font-semibold focus:outline-none focus:border-emerald-500"
                        >
                            <option value="other">Other</option>
                            <option value="lab_report">Lab Report</option>
                            <option value="prescription">Prior Prescription</option>
                            <option value="photo">Symptom Photo</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-ink-charcoal uppercase tracking-wider">File URL</label>
                        <input
                            type="text"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            placeholder="https://example.com/report.pdf"
                            className="p-3 border-2 border-ink-black rounded-xl bg-white font-semibold focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-ink-muted leading-tight">
                            Note: For simplicity in this demo, please paste a public URL to your file.
                        </span>
                    </div>

                    {status === 'error' && (
                        <p className="text-sm font-bold text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            Failed to upload document. Please ensure URL is valid.
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="flex-1 py-3 bg-stone-100 border-2 border-ink-black rounded-xl font-bold text-ink-black text-sm hover:bg-stone-200 transition-colors"
                        >
                            Skip Upload
                        </button>
                        <button
                            type="submit"
                            disabled={!fileUrl.trim() || status === 'loading'}
                            className="flex-1 py-3 bg-emerald-600 border-2 border-ink-black shadow-[2px_2px_0px_#111] hover:shadow-[4px_4px_0px_#111] active:translate-y-0 active:shadow-none hover:-translate-y-0.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {status === 'loading' ? 'Uploading...' : status === 'success' ? 'Joined! 🎥' : 'Upload & Join Call 🎥'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
