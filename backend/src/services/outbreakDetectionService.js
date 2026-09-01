const { Op } = require('sequelize');
const { DiseaseReport, OutbreakAlert } = require('../models');
const config = require('../config/outbreakThresholds');
const ngeohash = require('ngeohash');

/**
 * Calculates risk level purely based on counts.
 * Testable pure function.
 * @param {number} currentCount 
 * @param {number} previousCount 
 * @param {object} thresholds 
 * @returns {'severe'|'moderate'|'watch'|null}
 */
function calculateRiskLevel(currentCount, previousCount, thresholds) {
    if (currentCount === 0) return null;

    let growthPct = 0;
    if (previousCount > 0) {
        growthPct = ((currentCount - previousCount) / previousCount) * 100;
    } else if (currentCount > 0) {
        growthPct = 100; // Infinity mathematically, but cap for our logic
    }

    // Evaluate severe
    if (currentCount >= thresholds.severe.minCases || growthPct >= thresholds.severe.growthPct) {
        return 'severe';
    }
    // Evaluate moderate
    if (currentCount >= thresholds.moderate.minCases || growthPct >= thresholds.moderate.growthPct) {
        return 'moderate';
    }
    // Evaluate watch
    if (currentCount >= thresholds.watch.minCases) {
        return 'watch';
    }

    return null;
}

/**
 * Aggregate counts and upsert into outbreak_alerts.
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
        attributes: ['geohash', 'diseaseCategory', [require('../config/db').fn('COUNT', '*'), 'count']],
        where: {
            reportedAt: {
                [Op.gte]: windowStart
            }
        },
        group: ['geohash', 'diseaseCategory'],
        raw: true
    });

    const previousReports = await DiseaseReport.findAll({
        attributes: ['geohash', 'diseaseCategory', [require('../config/db').fn('COUNT', '*'), 'count']],
        where: {
            reportedAt: {
                [Op.gte]: previousWindowStart,
                [Op.lt]: windowStart
            }
        },
        group: ['geohash', 'diseaseCategory'],
        raw: true
    });

    const prevCountMap = {};
    for (const row of previousReports) {
        prevCountMap[`${row.geohash}_${row.diseaseCategory}`] = parseInt(row.count, 10);
    }

    const updatedAlerts = [];

    // Process each grouping in the current window
    for (const row of currentReports) {
        const geohash = row.geohash;
        const diseaseCategory = row.diseaseCategory;
        const currentCount = parseInt(row.count, 10);

        if (!geohash) continue;

        const previousCount = prevCountMap[`${geohash}_${diseaseCategory}`] || 0;

        const riskLevel = calculateRiskLevel(currentCount, previousCount, cfg.thresholds);

        if (!riskLevel) continue; // Below watch threshold

        const decoded = ngeohash.decode(geohash);
        const centerLat = decoded.latitude;
        const centerLng = decoded.longitude;

        // Upsert into OutbreakAlert
        const [alert, created] = await OutbreakAlert.findOrCreate({
            where: { geohash, diseaseCategory },
            defaults: {
                caseCount: currentCount,
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
            let updates = { caseCount: currentCount };

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

            if (alert.caseCount !== currentCount) {
                updates.caseCount = currentCount;
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
