import api from './api';

const diagnosticService = {
    createRequest: async (data) => {
        const response = await api.post('/diagnostics', data);
        return response.data;
    },
    
    getRequests: async (params = {}) => {
        const response = await api.get('/diagnostics', { params });
        return response.data;
    },
    
    updateStatus: async (id, data) => {
        const response = await api.put(`/diagnostics/${id}/status`, data);
        return response.data;
    },
    
    uploadResult: async (id, file) => {
        const formData = new FormData();
        formData.append('document', file);
        
        const response = await api.post(`/diagnostics/${id}/result`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default diagnosticService;
