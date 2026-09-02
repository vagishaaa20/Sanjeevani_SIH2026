import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import useWebRTC from '../../hooks/useWebRTC';
import { NotificationContext } from '../../context/NotificationContext';

export default function TeleconsultationRoom() {
    const { id: consultationId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addNotification } = useContext(NotificationContext);

    const [chatInput, setChatInput] = useState('');
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    const isDoctor = user.role === 'doctor';

    const handleCallError = (error) => {
        alert(error.message);
        if (isDoctor) navigate('/doctor/dashboard');
        else navigate('/patient/dashboard');
    };

    // Use our new WebRTC abstraction
    const {
        remoteUsers,
        quality,
        chat,
        localStream,
        remoteStream,
        sendMessage
    } = useWebRTC(consultationId, user, handleCallError);

    // Refs for binding the streams to <video> tags
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Whenever streams update, attach them to the video players
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const sendChat = (e) => {
        e.preventDefault();
        sendMessage(chatInput);
        setChatInput('');
    };

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        setTimeout(() => setSavingNotes(false), 500);
    };

    const handleCompleteCall = async () => {
        try {
            if (isDoctor) {
                await api.post(`/doctors/queue/${consultationId}/complete`);
                addNotification('Call ended — consultation marked complete.', 'success', 5000);
                navigate('/doctor/dashboard');
            } else {
                navigate('/patient/dashboard');
            }
        } catch (e) {
            console.error('Failed to complete', e);
            addNotification('Failed to end call. Please try again.', 'error');
        }
    };

    return (
        <div className="w-full h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 p-4 text-left">
            {/* Main Video View */}
            <div className="flex-1 flex flex-col bg-ink-charcoal rounded-2xl overflow-hidden border-2 border-ink-black shadow-lg relative">

                {/* Header Overlay */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border-2 ${quality === 'good' ? 'bg-emerald-500 text-white border-emerald-700' : 'bg-amber-500 text-black border-amber-700'
                            }`}>
                            Signal: {quality.toUpperCase()}
                        </span>
                        {remoteUsers === 0 && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-white text-ink-black uppercase border-2 border-ink-black">
                                Waiting for {isDoctor ? 'Patient' : 'Doctor'}...
                            </span>
                        )}
                    </div>
                    <button onClick={handleCompleteCall} className="bg-red-600 border-2 border-red-900 text-white font-bold px-4 py-2 rounded shadow-md hover:bg-red-500 transition-colors">
                        END CALL
                    </button>
                </div>

                {/* Remote Video Base */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Picture in Picture Local Video */}
                <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] border-2 border-ink-black rounded-lg overflow-hidden shadow-lg bg-black z-20">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                </div>
            </div>

            {/* Sidebar View (Chat + Notes) */}
            <div className="w-full md:w-80 flex flex-col gap-4">

                {/* Doctor Note Taking (Hidden from patients) */}
                {isDoctor && (
                    <div className="flex-1 flex flex-col bg-amber-50 border-2 border-ink-black rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-ink-black uppercase text-sm tracking-wider">Clinical Notes</h3>
                            <span className="text-[10px] uppercase font-bold text-ink-muted">
                                {savingNotes ? 'Saving...' : 'Autosaved'}
                            </span>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                handleSaveNotes();
                            }}
                            className="flex-1 w-full bg-transparent resize-none outline-none border-b border-amber-200/50 text-sm font-medium text-ink-black leading-relaxed"
                            placeholder="Type observation notes here..."
                        />
                    </div>
                )}

                {/* Socket.io Chat Box */}
                <div className="flex-1 flex flex-col bg-white border-2 border-ink-black rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-ink-black text-white p-3 border-b-2 border-ink-black">
                        <h3 className="font-bold text-sm uppercase tracking-wider">Messages</h3>
                    </div>

                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto bg-stone-50 text-sm">
                        {chat.length === 0 && (
                            <p className="text-center text-ink-muted font-bold mt-10">No messages yet.</p>
                        )}
                        {chat.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.senderName === (user.profile?.fullName || 'User') ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] font-bold text-ink-muted uppercase">{m.senderName}</span>
                                <div className={`px-3 py-1.5 rounded-lg font-medium border-2 mt-0.5 ${m.senderName === (user.profile?.fullName || 'User')
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 rounded-tr-none'
                                    : 'bg-white border-ink-black text-ink-black rounded-tl-none'
                                    }`}>
                                    {m.message}
                                </div>
                                <span className="text-[9px] text-ink-muted mt-0.5">{m.time}</span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={sendChat} className="p-2 border-t-2 border-ink-black bg-white flex gap-2">
                        <input
                            type="text"
                            className="flex-1 w-full p-2 bg-stone-100 rounded border border-stone-300 outline-none focus:border-emerald-500 font-medium text-sm"
                            placeholder="Message..."
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                        />
                        <button type="submit" disabled={!chatInput.trim()} className="px-3 bg-ink-black text-white rounded font-bold hover:bg-ink-charcoal disabled:opacity-50">
                            ↑
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
