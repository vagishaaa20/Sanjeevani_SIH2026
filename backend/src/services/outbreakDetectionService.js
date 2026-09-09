const { Op } = require('sequelize');
const { DiseaseReport, OutbreakAlert } = require('../models');
const config = require('../config/outbreakThresholds');
const ngeohash = require('ngeohash');

/**
 * Calculates risk level based on two-tier counts (reported and confirmed).
 * Testable pure function.
 * @returns {'severe'|'moderate'|'watch'|null}
 */
function calculateRiskLevel(currentConfirmed, currentReported, prevConfirmed, prevReported, thresholds) {
    if (currentConfirmed === 0 && currentReported === 0) return null;

    let confirmedGrowth = 0;
    if (prevConfirmed > 0) {
        confirmedGrowth = ((currentConfirmed - prevConfirmed) / prevConfirmed) * 100;
    } else if (currentConfirmed > 0) {
        confirmedGrowth = 100; // Infinity mathematically, but cap for our logic
    }

    let reportedGrowth = 0;
    if (prevReported > 0) {
        reportedGrowth = ((currentReported - prevReported) / prevReported) * 100;
    } else if (currentReported > 0) {
        reportedGrowth = 100;
    }

    // Evaluate severe (driven strictly by confirmed diagnoses)
    if (currentConfirmed >= thresholds.severe.minCases || confirmedGrowth >= thresholds.severe.growthPct) {
        return 'severe';
    }
    // Evaluate moderate (driven strictly by confirmed diagnoses)
    if (currentConfirmed >= thresholds.moderate.minCases || confirmedGrowth >= thresholds.moderate.growthPct) {
        return 'moderate';
    }
    // Evaluate watch (driven by unconfirmed/reported signals OR early confirmed signals)
    if (currentConfirmed >= thresholds.watch.minCases ||
        currentReported >= thresholds.moderate.minCases ||
        reportedGrowth >= thresholds.moderate.growthPct) {
        return 'watch';
    }
    if (currentReported >= thresholds.watch.minCases) {
        return 'watch';
    }

    return null;
}

/**
 * Aggregate counts (reported vs confirmed) and upsert into outbreak_alerts.
 * @returns {Promise<Array>} List of updated or new alerts
 */
async function runDetectionCycle(customConfig = null) {
    const cfg = customConfig || config;
    const now = new Date();

    const windowMs = cfg.windowHours * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - windowMs);
    const previousWindowStart = new Date(windowStart.getTime() - (windowMs * cfg.prevWindowMultiplier));

    // Get current window counts
    const currentReports = await DiseaseReport.findAll({
        attributes: ['geohash', 'diseaseCategory', 'confidenceLevel', [require('../config/db').fn('COUNT', '*'), 'count']],
        where: {
            reportedAt: {
                [Op.gte]: windowStart
            }
        },
        group: ['geohash', 'diseaseCategory', 'confidenceLevel'],
        raw: true
    });

    // Get previous window counts
    const previousReports = await DiseaseReport.findAll({
        attributes: ['geohash', 'diseaseCategory', 'confidenceLevel', [require('../config/db').fn('COUNT', '*'), 'count']],
        where: {
            reportedAt: {
                [Op.gte]: previousWindowStart,
                [Op.lt]: windowStart
            }
        },
        group: ['geohash', 'diseaseCategory', 'confidenceLevel'],
        raw: true
    });

    // Process previous reports into a map
    const prevCountMap = {};
    for (const row of previousReports) {
        const key = `${row.geohash}_${row.diseaseCategory}`;
        if (!prevCountMap[key]) prevCountMap[key] = { reportedCount: 0, confirmedCount: 0 };
        if (row.confidenceLevel === 'confirmed') prevCountMap[key].confirmedCount = parseInt(row.count, 10);
        else prevCountMap[key].reportedCount = parseInt(row.count, 10);
    }

    // Process current reports into a map
    const currentCountMap = {};
    for (const row of currentReports) {
        const key = `${row.geohash}_${row.diseaseCategory}`;
        if (!currentCountMap[key]) currentCountMap[key] = { reportedCount: 0, confirmedCount: 0 };
        if (row.confidenceLevel === 'confirmed') currentCountMap[key].confirmedCount = parseInt(row.count, 10);
        else currentCountMap[key].reportedCount = parseInt(row.count, 10);
    }

    const updatedAlerts = [];

    // Process each grouping in the current window
    for (const key of Object.keys(currentCountMap)) {
        const [geohash, diseaseCategory] = key.split('_');
        const curr = currentCountMap[key];

        if (!geohash) continue;

        const prev = prevCountMap[key] || { reportedCount: 0, confirmedCount: 0 };

        const riskLevel = calculateRiskLevel(curr.confirmedCount, curr.reportedCount, prev.confirmedCount, prev.reportedCount, cfg.thresholds);

        if (!riskLevel) continue; // Below watch threshold

        const decoded = ngeohash.decode(geohash);
        const centerLat = decoded.latitude;
        const centerLng = decoded.longitude;

        // Upsert into OutbreakAlert
        const [alert, created] = await OutbreakAlert.findOrCreate({
            where: { geohash, diseaseCategory },
            defaults: {
                reportedCount: curr.reportedCount,
                confirmedCount: curr.confirmedCount,
                riskLevel,
                centerLat,
                centerLng,
                radiusKm: cfg.radiusKm,
                isActive: true,
                thresholdBreachedAt: now,
            }
        });

        if (!created) {
            let shouldUpdate = false;
            let updates = {
                reportedCount: curr.reportedCount,
                confirmedCount: curr.confirmedCount
            };

            // If it was inactive, reactivate it
            if (!alert.isActive) {
                updates.isActive = true;
                updates.thresholdBreachedAt = now;
                updates.resolvedAt = null;
                updates.notifiedAt = null; // allow alerting again
                shouldUpdate = true;
            }

            // Determine if escalated
            const riskLevels = ['watch', 'moderate', 'severe'];
            const currentRiskIdx = riskLevels.indexOf(alert.riskLevel);
            const newRiskIdx = riskLevels.indexOf(riskLevel);

            if (newRiskIdx > currentRiskIdx) {
                updates.riskLevel = riskLevel;
                updates.notifiedAt = null; // Re-notify on escalation
                updates.thresholdBreachedAt = now;
                shouldUpdate = true;
            } else if (newRiskIdx < currentRiskIdx && alert.isActive) {
                // Downgrade (optional depending on product requirement, let's allow downgrade without re-notify)
                updates.riskLevel = riskLevel;
                shouldUpdate = true;
            }

            if (alert.reportedCount !== curr.reportedCount || alert.confirmedCount !== curr.confirmedCount) {
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                await alert.update(updates);
                updatedAlerts.push(alert);
            }
        } else {
            updatedAlerts.push(alert);
        }
    }

    return updatedAlerts;
}

module.exports = {
    calculateRiskLevel,
    runDetectionCycle
};
