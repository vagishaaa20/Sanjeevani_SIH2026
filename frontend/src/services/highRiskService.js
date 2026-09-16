import api from './api';

const highRiskService = {
    getPatients: async () => {
        const response = await api.get('/high-risk/patients');
        return response.data;
    },
    
    getPatientDetails: async (patientId) => {
        const response = await api.get(`/high-risk/patients/${patientId}`);
        return response.data;
    },
    
    escalatePatient: async (patientId, payload) => {
        const response = await api.patch(`/high-risk/patients/${patientId}/escalate`, payload);
        return response.data;
    },
    
    updateStatus: async (patientId, status) => {
        const response = await api.patch(`/high-risk/patients/${patientId}/status`, { status });
        return response.data;
    },
    
    createManualHighRisk: async (patientId, riskReason) => {
        const response = await api.post(`/high-risk/patients/${patientId}/manual`, { riskReason });
        return response.data;
    }
};

export default highRiskService;
