import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Public page — no auth required.
 * Route: /verify/:consultationId
 *
 * Recomputes the canonical hash server-side and checks against Polygon Amoy.
 */
export default function VerifyPrescription() {
    const { consultationId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!consultationId) return;
        fetch(`${API_BASE}/verify/${consultationId}`)
            .then(async (r) => {
                if (!r.ok) {
                    const body = await r.json().catch(() => ({}));
                    throw new Error(body.error || `HTTP ${r.status}`);
                }
                return r.json();
            })
            .then(setResult)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [consultationId]);

    const statusMeta = {
        verified: { icon: '✅', colour: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', label: 'Prescription Verified' },
        pending: { icon: '⏳', colour: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Verification Pending' },
        hash_mismatch: { icon: '❌', colour: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Tampered / Mismatch' },
        not_found_on_chain: { icon: '⚠️', colour: '#b45309', bg: '#fffbeb', border: '#fde68a', label: 'Not Found on Chain' },
        chain_unreachable: { icon: '🔌', colour: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: 'Blockchain Unreachable' },
        no_hash: { icon: '📄', colour: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: 'Hash Not Generated Yet' },
    };

    const meta = result ? (statusMeta[result.status] || statusMeta['no_hash']) : null;

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
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#0d9488' }}>Sanjeevani</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Blockchain Prescription Verification
                </div>
            </div>

            {/* Card */}
            <div style={{
                background: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '20px',
                padding: '36px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            }}>
                {loading && (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '24px 0' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                        <p style={{ fontWeight: '600' }}>Verifying prescription…</p>
                        <p style={{ fontSize: '13px', marginTop: '6px' }}>Querying Polygon Amoy blockchain</p>
                    </div>
                )}

                {error && !loading && (
                    <div style={{ textAlign: 'center', color: '#dc2626' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                        <p style={{ fontWeight: '700' }}>Could not verify</p>
                        <p style={{ fontSize: '13px', marginTop: '6px' }}>{error}</p>
                    </div>
                )}

                {result && !loading && meta && (
                    <>
                        {/* Status badge */}
                        <div style={{
                            background: meta.bg,
                            border: `2px solid ${meta.border}`,
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            marginBottom: '24px',
                        }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{meta.icon}</div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: meta.colour }}>{meta.label}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', lineHeight: '1.5' }}>
                                {result.message}
                            </div>
                        </div>

                        {/* Detail rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                            <DetailRow label="Consultation ID" value={consultationId} mono />

                            {result.prescriptionHash && (
                                <DetailRow
                                    label="Content Hash (SHA-256)"
                                    value={result.prescriptionHash}
                                    mono
                                />
                            )}

                            {result.blockchainTxHash && (
                                <DetailRow
                                    label="Transaction Hash"
                                    value={result.blockchainTxHash}
                                    mono
                                    link={result.explorerUrl}
                                />
                            )}

                            {result.anchoredAt && (
                                <DetailRow
                                    label="Anchored On Chain"
                                    value={new Date(result.anchoredAt).toLocaleString('en-IN', {
                                        dateStyle: 'long', timeStyle: 'short'
                                    })}
                                />
                            )}

                            {result.anchoredBy && (
                                <DetailRow label="Anchored By (wallet)" value={result.anchoredBy} mono />
                            )}

                            {result.contractAddress && (
                                <DetailRow
                                    label="Contract Address"
                                    value={result.contractAddress}
                                    mono
                                    link={`https://amoy.polygonscan.com/address/${result.contractAddress}`}
                                />
                            )}
                        </div>

                        {/* Explorer CTA */}
                        {result.explorerUrl && (
                            <a
                                href={result.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    marginTop: '24px',
                                    padding: '12px',
                                    background: '#0d9488',
                                    color: '#ffffff',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textDecoration: 'none',
                                }}
                            >
                                🔗 View on Polygon Amoy Explorer ↗
                            </a>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <Link
                    to="/verify"
                    style={{
                        display: 'inline-block',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#0d9488',
                        fontWeight: '600',
                        textDecoration: 'none',
                        border: '1px solid #0d9488',
                        padding: '8px 16px',
                        borderRadius: '20px'
                    }}
                >
                    📁 Upload a PDF to Verify Instead
                </Link>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Powered by Sanjeevani · Polygon Amoy Testnet
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value, mono = false, link = null }) {
    const textStyle = {
        fontSize: '12px',
        color: '#1a1a1a',
        fontFamily: mono ? "'Courier New', monospace" : 'inherit',
        wordBreak: 'break-all',
    };

    return (
        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                {label}
            </div>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" style={{ ...textStyle, color: '#0d9488' }}>
                    {value}
                </a>
            ) : (
                <div style={textStyle}>{value}</div>
            )}
        </div>
    );
}
