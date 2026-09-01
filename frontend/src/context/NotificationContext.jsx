import React, { createContext, useState } from 'react';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const newNotif = { id, message, type };

        setNotifications((prev) => [...prev, newNotif]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    };

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
            {/* Toast popup portal overlay */}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`pointer-events-auto p-4 rounded-xl border border-ink-black shadow-md flex justify-between items-center bg-cream-card transition-all duration-300 transform translate-y-0 animate-fade-in-up`}
                    >
                        <div className="flex gap-2 items-center">
                            <span
                                className={`w-2.5 h-2.5 rounded-full ${n.type === 'error'
                                        ? 'bg-rose-500'
                                        : n.type === 'success'
                                            ? 'bg-emerald-500'
                                            : 'bg-cerulean'
                                    }`}
                            />
                            <p className="text-sm font-medium text-ink-black">{n.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="ml-4 text-ink-muted hover:text-ink-black text-xs font-bold bg-cream-surface px-1.5 py-0.5 rounded cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
