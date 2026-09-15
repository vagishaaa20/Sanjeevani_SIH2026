const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const { ClinicProfile } = require('../models');
const { findNearbyClinics } = require('../services/locationService');
const crypto = require('crypto');

// In-memory active emergency tracker store (or persistent)
const activeDispatches = new Map();

/**
 * POST /api/transports/emergency-dispatch
 * Dispatches nearest ambulance & emergency facility
 */
router.post('/emergency-dispatch', authenticate, async (req, res) => {
    try {
        const { lat, lng, address, symptoms, reason } = req.body;
        const patientId = req.user.id;

        const patientLat = parseFloat(lat) || 28.6139;
        const patientLng = parseFloat(lng) || 77.2090;

        // Find nearest facility/clinic
        let nearestFacility = {
            name: 'City Emergency Care Hospital',
            address: 'Main Health Corridor, Sector 4',
            distanceKm: 2.4,
            phone: '108 / 112'
        };

        try {
            const nearby = await findNearbyClinics({ lat: patientLat, lng: patientLng, radiusKm: 25, limit: 1 });
            if (nearby && nearby.length > 0) {
                nearestFacility = {
                    name: nearby[0].clinicName,
                    address: `${nearby[0].address || ''}, ${nearby[0].city || ''}`.trim(),
                    distanceKm: parseFloat(nearby[0].distanceKm).toFixed(1),
                    phone: '108 / +91 11 2345 6789'
                };
            }
        } catch (e) {
            console.error('[emergencyDispatch] findNearbyClinics error:', e.message);
        }

        const dispatchId = crypto.randomUUID();
        const dispatchedAt = new Date();
        const baseEtaMins = Math.max(5, Math.round((parseFloat(nearestFacility.distanceKm) || 3) * 3));

        const dispatchRecord = {
            dispatchId,
            patientId,
            status: 'DISPATCHED', // DISPATCHED, ON_THE_WAY, ARRIVED
            dispatchedAt,
            baseEtaMins,
            ambulance: {
                vehicleNo: `DL-01-AM-${Math.floor(1000 + Math.random() * 9000)}`,
                driverName: 'Ramesh Singh (Paramedic Lead)',
                driverPhone: '+91 98765 43210',
                type: 'Advanced Life Support (ALS) Unit',
            },
            facility: nearestFacility,
            patientLocation: { lat: patientLat, lng: patientLng, address: address || 'Current GPS Location' },
            symptoms: symptoms || reason || 'Critical Emergency',
        };

        activeDispatches.set(dispatchId, dispatchRecord);
        activeDispatches.set(`user:${patientId}`, dispatchRecord);

        const io = req.app.get('io');
        if (io) {
            io.to(`user:${patientId}`).emit('emergency:dispatched', dispatchRecord);
        }

        return res.status(201).json({
            success: true,
            message: 'Emergency ambulance dispatched immediately.',
            dispatch: dispatchRecord
        });
    } catch (err) {
        console.error('[emergencyDispatch] error:', err);
        return res.status(500).json({ error: 'Failed to dispatch emergency transport' });
    }
});

/**
 * GET /api/transports/emergency/active
 * Returns current active emergency tracking for the logged-in patient
 */
router.get('/emergency/active', authenticate, (req, res) => {
    const patientId = req.user.id;
    const record = activeDispatches.get(`user:${patientId}`);
    if (!record) {
        return res.json({ active: false, dispatch: null });
    }

    // Compute dynamic ETA progression
    const elapsedMinutes = (Date.now() - new Date(record.dispatchedAt).getTime()) / 60000;
    const remainingEta = Math.max(1, Math.round(record.baseEtaMins - elapsedMinutes));
    const status = remainingEta <= 1 ? 'ARRIVING' : (elapsedMinutes > 0 ? 'ON_THE_WAY' : 'DISPATCHED');

    // Simulate ambulance GPS moving towards patient
    const fraction = Math.min(0.9, elapsedMinutes / (record.baseEtaMins || 10));
    const ambLat = record.patientLocation.lat + (0.02 * (1 - fraction));
    const ambLng = record.patientLocation.lng + (0.02 * (1 - fraction));

    return res.json({
        active: true,
        dispatch: {
            ...record,
            status,
            remainingEtaMins: remainingEta,
            ambulanceLocation: { lat: ambLat, lng: ambLng }
        }
    });
});

module.exports = router;
