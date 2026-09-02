import { useEffect, useRef, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

// Basic STUN server configuration for NAT traversal
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ]
};

/**
 * Encapsulates all WebRTC Peer-to-Peer and Socket.io signaling logic.
 * Exposes a clean API for the UI to use, making future PaaS switches easier.
 */
export default function useWebRTC(roomId, user, onCallError) {
    const { socket } = useContext(SocketContext);

    const [remoteUsers, setRemoteUsers] = useState(0);
    const [quality, setQuality] = useState('good');
    const [chat, setChat] = useState([]);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const peerConnection = useRef(null);
    const localStreamRef = useRef(null); // synchronous reference for cleanups
    const remoteStreamRef = useRef(null);
    const initDone = useRef(false);

    // Stable references to prevent useEffect teardown loops
    const userRef = useRef(user);
    const onCallErrorRef = useRef(onCallError);
    const lastFallbackEmit = useRef(0);

    useEffect(() => {
        userRef.current = user;
        onCallErrorRef.current = onCallError;
    }, [user, onCallError]);

    useEffect(() => {
        if (!socket || !roomId || !userRef.current?.id || initDone.current) return;
        initDone.current = true;

        // 1. Join socket room
        socket.emit('join-room', { roomId, userId: userRef.current.id });

        // 2. Setup WebRTC Peer Connection
        const setupPeerConnection = async () => {
            try {
                // Get media constraints optimized for performance
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640, max: 640 },
                        height: { ideal: 480, max: 480 },
                        frameRate: { ideal: 20, max: 24 }
                    },
                    audio: true
                });
                localStreamRef.current = stream;
                setLocalStream(stream);

                // Setup PC
                peerConnection.current = new RTCPeerConnection(configuration);
                stream.getTracks().forEach(track => {
                    peerConnection.current.addTrack(track, stream);
                });

                peerConnection.current.ontrack = (event) => {
                    if (event.streams?.[0]) {
                        setRemoteUsers(1);
                        setRemoteStream(event.streams[0]);
                        remoteStreamRef.current = event.streams[0];
                    }
                };

                peerConnection.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('webrtc:ice-candidate', {
                            roomId,
                            candidate: event.candidate,
                            senderId: user.id
                        });
                    }
                };

                peerConnection.current.oniceconnectionstatechange = () => {
                    if (['disconnected', 'failed', 'closed'].includes(peerConnection.current.iceConnectionState)) {
                        setRemoteUsers(0); // remote dropped
                        setRemoteStream(null);
                        remoteStreamRef.current = null;
                        setQuality('poor');
                    }
                };

                // Track Quality Loop
                const checkConnectionQuality = async () => {
                    if (!peerConnection.current) return;
                    try {
                        const stats = await peerConnection.current.getStats();
                        let hasPoorQuality = false;

                        stats.forEach(report => {
                            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                                const total = report.packetsLost + report.packetsReceived;
                                const packetLoss = total ? report.packetsLost / total : 0;
                                if (packetLoss > 0.05) hasPoorQuality = true;
                            }
                        });

                        if (hasPoorQuality) {
                            setQuality('poor');
                            const now = Date.now();
                            // Throttle fallback emits to once every 10 seconds
                            if (now - lastFallbackEmit.current > 10000) {
                                socket.emit('webrtc:quality-fallback', { roomId, senderId: userRef.current.id });
                                lastFallbackEmit.current = now;
                            }
                        } else {
                            setQuality('good');
                        }
                    } catch (e) {
                        console.error('Stats error', e);
                    }
                };

                const intervalId = setInterval(checkConnectionQuality, 3000);

                // Expose interval to cleanup
                peerConnection.current.qualityInterval = intervalId;

            } catch (err) {
                console.error('Camera/Mic access denied or failed:', err);
                if (onCallError) onCallError({ message: 'Could not access camera/mic.' });
            }
        };

        setupPeerConnection();

        // 3. Listen to Signaling Events
        const handleUserJoined = async ({ userId }) => {
            console.log('Remote user joined, sending offer...', userId);
            setRemoteUsers(1);
            if (!peerConnection.current) return;
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit('webrtc:offer', { roomId, offer, senderId: userRef.current.id });
        };

        const handleOffer = async ({ offer, senderId }) => {
            if (senderId === userRef.current.id || !peerConnection.current) return;
            console.log('Received offer, sending answer...');
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit('webrtc:answer', { roomId, answer, senderId: userRef.current.id });
        };

        const handleAnswer = async ({ answer, senderId }) => {
            if (senderId === userRef.current.id || !peerConnection.current) return;
            console.log('Received answer...');
            const remoteDesc = new RTCSessionDescription(answer);
            await peerConnection.current.setRemoteDescription(remoteDesc);
        };

        const handleIceCandidate = async ({ candidate, senderId }) => {
            if (senderId === userRef.current.id || !peerConnection.current) return;
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        };

        const handleChatMessage = (data) => {
            setChat(prev => [...prev, data]);
        };

        const handleQualityFallback = ({ senderId }) => {
            if (senderId !== userRef.current.id) {
                console.warn('Remote user has poor quality. Suggesting audio only...');
            }
        };

        const handleError = ({ message }) => {
            if (onCallErrorRef.current) onCallErrorRef.current({ message });
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('webrtc:offer', handleOffer);
        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:ice-candidate', handleIceCandidate);
        socket.on('webrtc:chat-message', handleChatMessage);
        socket.on('webrtc:quality-fallback', handleQualityFallback);
        socket.on('webrtc:error', handleError);

        return () => {
            initDone.current = false;
            socket.off('user-joined');
            socket.off('webrtc:offer');
            socket.off('webrtc:answer');
            socket.off('webrtc:ice-candidate');
            socket.off('webrtc:chat-message');
            socket.off('webrtc:error');
            socket.emit('leave-room', { roomId, userId: userRef.current.id });

            // Synchronously stop all tracks to prevent camera light staying on/leaks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }
            if (remoteStreamRef.current) {
                remoteStreamRef.current.getTracks().forEach(t => t.stop());
                remoteStreamRef.current = null;
            }
            setLocalStream(null);
            setRemoteStream(null);

            if (peerConnection.current) {
                if (peerConnection.current.qualityInterval) {
                    clearInterval(peerConnection.current.qualityInterval);
                }
                peerConnection.current.close();
                peerConnection.current = null;
            }
        };
    }, [socket, roomId]);

    const sendMessage = (messageText) => {
        if (!messageText.trim()) return;
        const msgInfo = {
            roomId,
            message: messageText,
            senderName: user.profile?.fullName || 'User',
            time: new Date().toLocaleTimeString()
        };
        socket.emit('webrtc:chat-message', msgInfo);
        setChat(prev => [...prev, msgInfo]);
    };

    return {
        remoteUsers,
        quality,
        chat,
        localStream,
        remoteStream,
        sendMessage,
    };
}
