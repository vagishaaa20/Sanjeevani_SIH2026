import api from './api';

const healthWorkerAdminService = {
    getDirectory: async (role) => (await api.get('/health-worker/directory', { params: { role } })).data,
    getAssignments: async () => (await api.get('/health-worker/assignments')).data,
    assignPatient: async (patientId, healthWorkerId) => (await api.post('/health-worker/assignments', { patientId, healthWorkerId })).data,
    createReferral: async (payload) => (await api.post('/health-worker/referrals', payload)).data,
    getGeography: async (params = {}) => (await api.get('/health-worker/geography', { params })).data,
    getAreaOptions: async (params) => (await api.get('/health-worker/area-options', { params })).data,
    getCoverage: async () => (await api.get('/health-worker/coverage')).data,
    createCoverage: async (payload) => (await api.post('/health-worker/coverage', payload)).data,
};

export default healthWorkerAdminService;