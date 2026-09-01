import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';

export const useQueue = (clinicId) => {
    const { socket, connected } = useContext(SocketContext);
    const [queueState, setQueueState] = useState(null);

    useEffect(() => {
        if (!socket || !connected || !clinicId) return;

        // Join room for this clinic's queue
        socket.emit('queue:join', { clinicId });

        // Handle initial state and live updates
        socket.on('queue:state', (state) => {
            setQueueState(state);
        });

        socket.on('queue:update', (updatedQueue) => {
            setQueueState((prev) => {
                if (!prev) return updatedQueue;
                return { ...prev, ...updatedQueue };
            });
        });

        return () => {
            socket.emit('queue:leave', { clinicId });
            socket.off('queue:state');
            socket.off('queue:update');
        };
    }, [socket, connected, clinicId]);

    const nextPatient = () => {
        if (socket) {
            socket.emit('queue:next', { clinicId });
        }
    };

    const skipPatient = (tokenId) => {
        if (socket) {
            socket.emit('queue:skip', { clinicId, tokenId });
        }
    };

    const completeServing = (tokenId) => {
        if (socket) {
            socket.emit('queue:complete', { clinicId, tokenId });
        }
    };

    return {
        queueState,
        nextPatient,
        skipPatient,
        completeServing,
        connected,
    };
};

export default useQueue;
