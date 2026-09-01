const { OutbreakAlert, DiseaseReport } = require('../models');
const { notifyOutbreak } = require('../services/outbreakNotifierService');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

async function getActive(req, res) {
    try {
        const alerts = await OutbreakAlert.findAll({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
        });
        return res.json({ alerts });
    } catch (err) {
        console.error('[outbreakController.getActive] Error:', err);
        return res.status(500).json({ error: 'Failed to fetch active alerts' });
    }
}

async function getDetails(req, res) {
    try {
        const { id } = req.params;
        const alert = await OutbreakAlert.findByPk(id);

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // 7-day trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Group by day for sparkline
        const reports = await DiseaseReport.findAll({
            attributes: [
                [sequelize.fn('date_trunc', 'day', sequelize.col('reported_at')), 'day'],
                [sequelize.fn('count', '*'), 'count']
            ],
            where: {
                geohash: alert.geohash,
                diseaseCategory: alert.diseaseCategory,
                reportedAt: { [Op.gte]: sevenDaysAgo }
            },
            group: [sequelize.fn('date_trunc', 'day', sequelize.col('reported_at'))],
            order: [[sequelize.fn('date_trunc', 'day', sequelize.col('reported_at')), 'ASC']],
            raw: true
        });

        // Format for response -> [{ date, count }]
        const trend = reports.map(r => ({
            date: r.day,
            count: parseInt(r.count, 10)
        }));

        return res.json({ alert, trend });
    } catch (err) {
        console.error('[outbreakController.getDetails] Error:', err);
        return res.status(500).json({ error: 'Failed to fetch details' });
    }
}

async function resolve(req, res) {
    try {
        const { id } = req.params;
        const alert = await OutbreakAlert.findByPk(id);

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        await alert.update({
            isActive: false,
            resolvedAt: new Date()
        });

        const io = req.app.get('io');
        if (io) {
            const payload = { id: alert.id, geohash: alert.geohash, resolved: true };
            io.to(`region:${alert.geohash}`).emit('outbreak:resolved', payload);
            io.to('admins').emit('outbreak:resolved', payload);
            io.to('doctors').emit('outbreak:resolved', payload);
        }

        return res.json({ message: 'Alert resolved', alert });
    } catch (err) {
        console.error('[outbreakController.resolve] Error:', err);
        return res.status(500).json({ error: 'Failed to resolve alert' });
    }
}

async function broadcast(req, res) {
    // Admin manually triggering advisory (even if not severe)
    try {
        const { id } = req.params;
        const alert = await OutbreakAlert.findByPk(id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        // Use notifier with severe-like dispatch behavior
        const io = req.app.get('io');
        // Force reset notifiedAt so logic passes
        await alert.update({ notifiedAt: null });

        // HACK: temporarily change riskLevel in memory to ensure whatsapp logic triggers inside notifyOutbreak
        const tempLevel = alert.riskLevel;
        alert.riskLevel = 'severe';
        await notifyOutbreak(alert, io);
        alert.riskLevel = tempLevel; // Keep actual DB value as is (we didn't call await alert.save() for riskLevel)

        return res.json({ message: 'Broadcast sent successfully' });
    } catch (err) {
        console.error('[outbreakController.broadcast] Error:', err);
        return res.status(500).json({ error: 'Failed to send broadcast' });
    }
}

module.exports = {
    getActive,
    getDetails,
    resolve,
    broadcast
};
