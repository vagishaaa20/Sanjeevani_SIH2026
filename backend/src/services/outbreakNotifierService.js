const sequelize = require('../config/db');
const { PatientProfile } = require('../models');
const { enqueueFreeText } = require('./waCloudService');

/**
 * Dispatches notifications when an outbreak is detected or escalated.
 * 
 * @param {OutbreakAlert} alert 
 * @param {object} io - The socket.io instance
 */
async function notifyOutbreak(alert, io) {
    if (alert.notifiedAt) return; // Already notified for this level

    const payload = {
        id: alert.id,
        geohash: alert.geohash,
        lat: alert.centerLat,
        lng: alert.centerLng,
        diseaseCategory: alert.diseaseCategory,
        riskLevel: alert.riskLevel,
        caseCount: alert.caseCount,
        radiusKm: alert.radiusKm,
    };

    // 1. Emit to geohash-specific room
    if (io) {
        io.to(`region:${alert.geohash}`).emit('outbreak:update', payload);

        // 2. Emit to all admins
        io.to('admins').emit('outbreak:update', payload);

        // 3. Emit to all doctors. (A more advanced version would match doctor regions, for now notify all logged-in doctors who might overlap)
        io.to('doctors').emit('outbreak:update', payload);
    }

    // 4. WhatsApp dispatch for 'severe' risk level
    if (alert.riskLevel === 'severe') {
        const radiusLat = alert.radiusKm / 111.32; // ~1 degree lat is 111km
        const radiusLng = alert.radiusKm / (40075 * Math.cos(alert.centerLat * Math.PI / 180) / 360);

        // Simple Haversine approximation query for patients within radius
        const patients = await PatientProfile.findAll({
            where: sequelize.literal(`
                latitude BETWEEN ${alert.centerLat - radiusLat} AND ${alert.centerLat + radiusLat}
                AND longitude BETWEEN ${alert.centerLng - radiusLng} AND ${alert.centerLng + radiusLng}
            `),
            include: ['user'] // Need User to get phone number
        });

        for (const pt of patients) {
            if (pt.user && pt.user.phone) {
                const phone = pt.user.phone.replace('+', '');
                enqueueFreeText(
                    phone,
                    `🚨 *Sanjeevani Health Alert*\n\nOutbreak detected: *${alert.diseaseCategory}* in your area.\nCases: ${alert.caseCount}.\nPlease take precautions and consult a doctor if you have symptoms.\n\nReply MENU to access Sanjeevani.`
                ).catch((err) => console.error('[outbreakNotifier] WhatsApp enqueue failed:', err.message));
            }
        }
    }

    // Mark as notified
    await alert.update({ notifiedAt: new Date() });
}

module.exports = {
    notifyOutbreak
};
