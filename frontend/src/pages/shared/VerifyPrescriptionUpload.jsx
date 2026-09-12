import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SanjeevaniLogo from '../../components/common/SanjeevaniLogo';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function VerifyPrescriptionUpload() {
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const processFile = async (file) => {
        if (!file || file.type !== 'application/pdf') {
            setError('Please upload a valid PDF document.');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const res = await fetch(`${API_BASE}/verify/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to process document');
            }

            const data = await res.json();
            if (data.consultationId) {
                // Instantly teleport patient to the existing verify page
                navigate(`/verify/${data.consultationId}`);
            } else {
                throw new Error('No consultation ID found in document text.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            padding: '24px',
        }}>
            <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #ffe6ee 0%, #ffffff 100%)',
                    border: '2px solid #f5c6d6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    boxShadow: '0 4px 12px rgba(216, 27, 96, 0.12)'
                }}>
                    <SanjeevaniLogo variant="emblem" size={42} />
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#1c1218', letterSpacing: '-0.5px' }}>SANJEEVANI</div>
                <div style={{ fontSize: '13px', color: '#e13b68', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Blockchain Prescription Verification
                </div>
            </div>

            <div style={{
                background: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '20px',
                padding: '40px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                textAlign: 'center'
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                    Verify a Prescription
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
                    Upload a Sanjeevani prescription PDF. We will extract its cryptographic hash and query the Polygon Amoy blockchain to ensure it has not been tampered with.
                </p>

                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    style={{
                        padding: '40px 20px',
                        border: `2px dashed ${dragActive ? '#0d9488' : '#d1d5db'}`,
                        borderRadius: '16px',
                        backgroundColor: dragActive ? '#f0fdfa' : '#f9fafb',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                    }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleChange}
                        style={{ display: 'none' }}
                    />

                    {loading ? (
                        <div>
                            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>📄</div>
                            <p style={{ fontWeight: '600', color: '#0d9488', fontSize: '14px' }}>Analyzing document…</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📥</div>
                            <p style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                                Drag and drop PDF here
                            </p>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                or click to select file
                            </p>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{
                        marginTop: '20px',
                        padding: '12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '13px',
                        fontWeight: '500'
                    }}>
                        ⚠️ {error}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '24px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                Powered by Sanjeevani · Polygon Amoy Testnet
            </div>
        </div>
    );
}
