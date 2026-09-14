const express = require('express');
const router = express.Router();
const { ClinicProfile } = require('../models');
const { findNearbyClinics } = require('../services/locationService');

router.get('/', async (req, res) => {
    try {
        const { lat, lng, radiusKm = 20 } = req.query;
        if (lat && lng) {
            const clinics = await findNearbyClinics({
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                radiusKm: parseFloat(radiusKm),
            });
            return res.json({ facilities: clinics });
        }
        const clinics = await ClinicProfile.findAll({ limit: 50 });
        return res.json({ facilities: clinics });
    } catch (err) {
        console.error('[facilityRoutes error]:', err);
        return res.status(500).json({ error: 'Failed to fetch facilities' });
    }
});

router.get('/emergency-nearby', async (req, res) => {
    try {
        const { lat = 28.6139, lng = 77.2090, radiusKm = 25 } = req.query;
        const clinics = await findNearbyClinics({
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radiusKm: parseFloat(radiusKm),
        });

        const emergencyFacilities = clinics.map((c) => ({
            id: c.userId,
            name: c.clinicName,
            address: c.address,
            city: c.city,
            distanceKm: parseFloat(c.distanceKm || 2.5).toFixed(1),
            emergencyAvailable: true,
            icuBedsAvailable: Math.floor(3 + Math.random() * 8),
            ambulancePhone: '108',
            helpline: '+91 11 2345 6789'
        }));

        return res.json({ facilities: emergencyFacilities });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch emergency facilities' });
    }
});

module.exports = router;
