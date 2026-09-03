import api from './api';

const medicineService = {
    getClinicInventory: async () => {
        const response = await api.get('/medicine-inventory');
        return response.data;
    },

    createInventoryItem: async (payload) => {
        const response = await api.post('/medicine-inventory', payload);
        return response.data;
    },

    updateInventoryItem: async (medicineId, payload) => {
        const response = await api.patch(`/medicine-inventory/${medicineId}`, payload);
        return response.data;
    },

    deleteInventoryItem: async (medicineId) => {
        const response = await api.delete(`/medicine-inventory/${medicineId}`);
        return response.data;
    },

    searchMedicines: async ({ query, lat, lng }) => {
        const params = new URLSearchParams();
        params.set('query', query);
        if (lat !== undefined && lat !== null) params.set('lat', String(lat));
        if (lng !== undefined && lng !== null) params.set('lng', String(lng));

        const response = await api.get(`/medicines/search?${params.toString()}`);
        return response.data;
    },
};

export default medicineService;
