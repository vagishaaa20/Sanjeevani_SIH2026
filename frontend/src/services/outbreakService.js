import api from './api';

export const outbreakService = {
    getActiveAlerts: async () => {
        const response = await api.get('/outbreaks/active');
        return response.data;
    },

    getDetails: async (id) => {
        const response = await api.get(`/outbreaks/${id}/details`);
        return response.data;
    },

    resolveAlert: async (id) => {
        const response = await api.post(`/outbreaks/${id}/resolve`);
        return response.data;
    },

    broadcastAdvisory: async (id) => {
        const response = await api.post(`/outbreaks/${id}/broadcast`);
        return response.data;
    }
};
