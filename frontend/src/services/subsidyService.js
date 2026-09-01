import api from './api';

const subsidyService = {
    /**
     * GET /api/subsidy/me
     * Returns the patient's subsidy enrollment status and total amount saved.
     */
    getMySubsidy: async () => {
        const response = await api.get('/subsidy/me');
        return response.data; // { enrolled, status, subsidyPercent, totalSaved, application }
    },

    /**
     * POST /api/subsidy/apply
     * Submits a subsidy application.
     * @param {{ incomeBracket: string, pincode: string, idProofUrl?: string }} payload
     */
    applySubsidy: async (payload) => {
        const response = await api.post('/subsidy/apply', payload);
        return response.data;
    },
};

export default subsidyService;
