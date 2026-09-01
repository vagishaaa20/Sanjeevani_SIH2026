/**
 * Outbreak detection thresholds & configuration.
 * All values are overridable via environment variables so judges / admins
 * can tune the demo without touching code.
 *
 * risk_level logic (applied in order — first match wins):
 *   severe   → case_count >= SEVERE_CASES  OR  growth_pct >= SEVERE_GROWTH
 *   moderate → case_count >= MOD_CASES     OR  growth_pct >= MOD_GROWTH
 *   watch    → case_count >= WATCH_CASES
 */
module.exports = {
    /** Rolling window in hours for case aggregation */
    windowHours: parseInt(process.env.OUTBREAK_WINDOW_HOURS, 10) || 72,

    /** Previous window multiplier — e.g. 0.5 = compare vs 50% of windowHours ago */
    prevWindowMultiplier: 0.5,

    thresholds: {
        severe: {
            minCases: parseInt(process.env.OUTBREAK_SEV_CASES, 10) || 15,
            growthPct: parseInt(process.env.OUTBREAK_SEV_GROWTH, 10) || 100,
        },
        moderate: {
            minCases: parseInt(process.env.OUTBREAK_MOD_CASES, 10) || 6,
            growthPct: parseInt(process.env.OUTBREAK_MOD_GROWTH, 10) || 50,
        },
        watch: {
            minCases: parseInt(process.env.OUTBREAK_WATCH_CASES, 10) || 3,
        },
    },

    /** Radius (km) of the notification zone around geohash centroid */
    radiusKm: parseFloat(process.env.OUTBREAK_RADIUS_KM) || 10,

    /** Cron schedule for background detection cycle */
    cronSchedule: process.env.OUTBREAK_CRON || '*/5 * * * *',
};
