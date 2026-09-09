import api from './api';

const healthWorkerService = {
    getDashboard: async () => (await api.get('/health-worker/dashboard')).data,
    getPatients: async () => (await api.get('/health-worker/patients')).data,
    getPatient: async (patientId) => (await api.get(`/health-worker/patients/${patientId}`)).data,
    getFollowups: async () => (await api.get('/health-worker/followups')).data,
    createFollowup: async (payload) => (await api.post('/health-worker/followups', payload)).data,
    getReferrals: async () => (await api.get('/health-worker/referrals')).data,
    updateReferral: async (referralId, status) => (await api.patch(`/health-worker/referrals/${referralId}`, { status })).data,

    updateProfile: async (payload) => (await api.patch('/health-worker/profile', payload)).data,
};

export default healthWorkerService;