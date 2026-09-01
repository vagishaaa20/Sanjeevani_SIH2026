import api from './api';

const clinicService = {
    getPendingClinics: async () => {
        const response = await api.get('/clinics/pending');
        return response.data; // { clinics: [...] }
    },

    getAllClinics: async () => {
        const response = await api.get('/clinics');
        return response.data; // { count, clinics: [...] }
    },

    verifyClinic: async (id, status) => {
        const response = await api.patch(`/clinics/verify/${id}`, { status });
        return response.data; // { message, clinic }
    },

    updateClinicProfile: async (data) => {
        const response = await api.patch('/profile/clinic', data);
        return response.data;
    },

    getNearbyClinics: async ({ lat, lng, radiusKm = 15, specialization = null }) => {
        const response = await api.get('/clinics/nearby', {
            params: { lat, lng, radiusKm, specialization },
        });
        return response.data; // { count, clinics: [...] }
    },
};

export default clinicService;