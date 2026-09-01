import api from './api';

const consultationService = {
    /**
     * GET /api/consultations/me
     * Returns the logged-in patient's consultation history, paginated.
     */
    getMyConsultations: async (page = 1, limit = 10) => {
        const response = await api.get('/consultations/me', { params: { page, limit } });
        return response.data; // { total, page, limit, totalPages, consultations: [...] }
    },

    /**
     * POST /api/doctors/:doctorId/reviews
     * Submits a star rating + optional comment for a completed consultation.
     */
    postReview: async (doctorId, consultationId, rating, comment = '') => {
        const response = await api.post(`/doctors/${doctorId}/reviews`, {
            consultationId,
            rating,
            comment,
        });
        return response.data;
    },

    /**
     * GET /api/consultations/:id/rejoin
     * Returns WebRTC room info for an in-progress consultation.
     */
    rejoinCall: async (consultationId) => {
        const response = await api.get(`/consultations/${consultationId}/rejoin`);
        return response.data;
    },

    /**
     * POST /api/consultations/:id/summary
     * Generates or returns cached AI plain-language summary.
     * Returns { aiSummary, cached }.
     */
    generateSummary: async (consultationId) => {
        const response = await api.post(`/consultations/${consultationId}/summary`);
        return response.data;
    },

    /**
     * GET /api/consultations/timeline
     * Returns chronological list of patient symptom/outcome entries.
     */
    getTimeline: async () => {
        const response = await api.get('/consultations/timeline');
        return response.data; // { timeline: [...] }
    },
};

export default consultationService;
