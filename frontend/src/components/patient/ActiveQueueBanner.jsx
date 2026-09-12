import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import PreCallDocumentSubmit from './PreCallDocumentSubmit';

export default function ActiveQueueBanner({ onStateChange }) {
    const [activeQueue, setActiveQueue] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const { socket } = useContext(SocketContext);

    const checkQueue = async () => {
        try {
            const res = await api.get('/queues/my');
            const queues = res.data.queue || [];
            // Find SERVING first, otherwise WAITING
            const active = queues.find(q => q.status === 'SERVING') || queues.find(q => q.status === 'WAITING');
            setActiveQueue(active || null);
            if (onStateChange) onStateChange(active || null);

            // If serving but isJoining is not set yet, we could auto-popup, but banner allows explicit "Join"
        } catch (err) {
            console.error('Failed to check active queues for banner', err);
        }
    };

    useEffect(() => {
        checkQueue();
        const interval = setInterval(checkQueue, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleEvent = () => checkQueue();

        socket.on('consultation:accepted', handleEvent);
        socket.on('consultation:completed', handleEvent);

        return () => {
            socket.off('consultation:accepted', handleEvent);
            socket.off('consultation:completed', handleEvent);
        };
    }, [socket]);

    const handleJoinClick = () => {
        if (activeQueue && activeQueue.consultation) {
            setIsJoining(true);
        }
    };

    const handleCancelRequest = async () => {
        if (!activeQueue) return;
        try {
            await api.post(`/queues/${activeQueue.id}/cancel`);
            setActiveQueue(null);
            if (onStateChange) onStateChange(null);
        } catch (err) {
            console.error('Failed to cancel queue request', err);
            alert('Failed to cancel request. Please try again.');
        }
    };

    if (!activeQueue) return null;

    // Hide if specifically completed/missed by consultation state regardless of what the old Queue model says
    if (activeQueue.consultation && ['completed', 'missed'].includes(activeQueue.consultation.status)) {
        return null;
    }

    const cStatus = activeQueue.consultation?.status;
    const isRejoinable = cStatus === 'in_progress' || cStatus === 'disconnected';

    return (
        <>
            {isJoining && activeQueue.consultation && (
                <PreCallDocumentSubmit consultationId={activeQueue.consultation.id} />
            )}

            <div
                className="w-full rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between p-4 gap-4"
                style={{
                    background: activeQueue.status === 'WAITING' ? 'var(--pastel-peach-bg)' : isRejoinable ? 'rgba(59, 130, 246, 0.1)' : 'var(--pastel-mint-bg)',
                    border: activeQueue.status === 'WAITING' ? '1px solid var(--pastel-peach-text)' : isRejoinable ? '1px solid rgb(59, 130, 246)' : '1px solid var(--pastel-mint-text)'
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="flex flex-col items-center justify-center rounded-lg w-12 h-12"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                    >
                        <span className="text-[10px] font-black uppercase leading-none mt-1" style={{ color: 'var(--text-secondary)' }}>Token</span>
                        <span className="text-xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{activeQueue.tokenNumber}</span>
                    </div>
                    <div className="flex flex-col">
                        <h4 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                            {activeQueue.status === 'WAITING' ? 'Waiting in Queue' : isRejoinable ? 'Call Disconnected' : 'Doctor is Ready!'}
                        </h4>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            {activeQueue.status === 'WAITING'
                                ? `Waiting for ${activeQueue.doctorId ? 'doctor' : 'next available doctor'} to accept your request...`
                                : isRejoinable
                                    ? `Call in progress — tap to rejoin.`
                                    : `Your request was accepted. Tap Join Now to connect.`}
                        </p>
                    </div>
                </div>

                {activeQueue.status === 'WAITING' && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full animate-ping" style={{ background: 'var(--pastel-peach-text)' }} />
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--pastel-peach-text)' }}>Polling</span>
                        </div>
                        <button
                            onClick={handleCancelRequest}
                            className="px-4 py-2 rounded-lg font-bold uppercase tracking-wide hover:opacity-80 transition-colors text-xs cursor-pointer"
                            style={{ background: 'var(--pastel-pink-bg)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                        >
                            Cancel Request
                        </button>
                    </div>
                )}

                {activeQueue.status === 'SERVING' && (
                    <button
                        onClick={handleJoinClick}
                        className="px-6 py-2 text-white rounded-xl font-black uppercase tracking-wide shadow-[2px_2px_0px_#111] hover:shadow-[4px_4px_0px_#111] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                        style={{
                            background: isRejoinable ? 'rgb(37, 99, 235)' : 'var(--accent)',
                            border: '2px solid var(--border)'
                        }}
                    >
                        {isRejoinable ? 'Rejoin Call' : 'Join Now'}
                    </button>
                )}
            </div>
        </>
    );
}
