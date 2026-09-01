import api from './api';

const medicationReminderService = {
    /**
     * POST /api/medication-reminders/extract
     * Runs Gemini extraction on a consultation's prescription text.
     * Creates unconfirmed reminder rows for patient review.
     */
    extract: async (consultationId, prescriptionText) => {
        const response = await api.post('/medication-reminders/extract', {
            consultationId,
            prescriptionText,
        });
        return response.data; // { reminders: [...] }
    },

    /** GET /api/medication-reminders/me */
    listReminders: async () => {
        const response = await api.get('/medication-reminders/me');
        return response.data; // { reminders: [...] }
    },

    /** GET /api/medication-reminders/today */
    getToday: async () => {
        const response = await api.get('/medication-reminders/today');
        return response.data; // { today, doses: [...] }
    },

    /** PATCH /api/medication-reminders/:id */
    update: async (id, fields) => {
        const response = await api.patch(`/medication-reminders/${id}`, fields);
        return response.data;
    },

    /** POST /api/medication-reminders/:id/activate */
    activate: async (id) => {
        const response = await api.post(`/medication-reminders/${id}/activate`);
        return response.data;
    },

    /** POST /api/medication-reminders/:id/deactivate */
    deactivate: async (id) => {
        const response = await api.post(`/medication-reminders/${id}/deactivate`);
        return response.data;
    },

    /** POST /api/medication-reminders/:id/taken — Body: { time } */
    markTaken: async (id, time) => {
        const response = await api.post(`/medication-reminders/${id}/taken`, { time });
        return response.data;
    },
};

export default medicationReminderService;
