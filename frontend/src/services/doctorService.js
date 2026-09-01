import api from './api';

const doctorService = {
    getNearbyDoctors: async ({ lat, lng, radiusKm = 15, specialization = null }) => {
        const response = await api.get('/doctors/nearby', {
            params: { lat, lng, radiusKm, specialization },
        });
        return response.data; // { count, doctors: [...] }
    },
};

export default doctorService;
