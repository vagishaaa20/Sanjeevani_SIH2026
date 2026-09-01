import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

        const newSocket = io(SOCKET_URL, {
            autoConnect: false,
            // Auth is passed via socket.auth.token, not cookies — no withCredentials needed
            transports: ['polling', 'websocket'],
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnected(true);
            console.log('Socket.io connected:', newSocket.id);
        });

        newSocket.on('disconnect', (reason) => {
            setConnected(false);
            console.log('Socket.io disconnected:', reason);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });

        // Check if token already exists to auto-connect
        const token = localStorage.getItem('accessToken');
        if (token) {
            newSocket.auth = { token };
            newSocket.connect();
        }

        // Connect socket on login / storage change
        const handleLogin = () => {
            const activeToken = localStorage.getItem('accessToken');
            if (activeToken) {
                newSocket.auth = { token: activeToken };
                newSocket.connect();
            }
        };

        window.addEventListener('storage', handleLogin);

        return () => {
            window.removeEventListener('storage', handleLogin);
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};