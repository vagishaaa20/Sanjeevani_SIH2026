require('../config/env');
const sequelize = require('../config/db');
const { DiseaseReport } = require('../models');
const { runDetectionCycle } = require('../services/outbreakDetectionService');
const ngeohash = require('ngeohash');

async function runSeed() {
    console.log('Seeding demo disease reports...');

    await sequelize.authenticateDatabase();

    // Clear old data for demo clarity
    await sequelize.query('TRUNCATE table outbreak_alerts CASCADE');
    await sequelize.query('TRUNCATE table disease_reports CASCADE');

    const now = new Date();
    const reports = [];

    // Helper to generate n reports at roughly the same coords over the last X hours
    const generateCluster = (category, lat, lng, count, maxHoursAgo) => {
        for (let i = 0; i < count; i++) {
            const jitterLat = lat + (Math.random() - 0.5) * 0.02; // ~2km jitter
            const jitterLng = lng + (Math.random() - 0.5) * 0.02;
            const reportedAt = new Date(now.getTime() - (Math.random() * maxHoursAgo * 60 * 60 * 1000));
            const geohash = ngeohash.encode(jitterLat, jitterLng, 5);

            reports.push({
                diseaseCategory: category,
                symptomTags: ['demo-seeded'],
                latitude: jitterLat,
                longitude: jitterLng,
                geohash,
                reportedAt,
                source: 'triage',
                severityScore: 2
            });
        }
    };

    // Region 1: Jamshedpur Central (Trending Severe for Fever/Infectious, e.g. Dengue)
    // 25 cases in the last 24 hours
    generateCluster('Fever/Infectious', 22.8046, 86.2029, 25, 24);

    // Region 2: Ranchi (Moderate for Respiratory)
    // 8 cases in the last 48 hours
    generateCluster('Respiratory', 23.3441, 85.3096, 8, 48);

    // Region 3: Dhanbad (Watch for Gastrointestinal)
    // 4 cases in the last 72 hours
    generateCluster('Gastrointestinal', 23.7915, 86.4304, 4, 72);

    // Write all to DB
    await DiseaseReport.bulkCreate(reports);
    console.log(`✅ Inserted ${reports.length} synthetic disease reports.`);

    // Run the detection cycle to populate outbreak_alerts
    // Disable socket/whatsapp dispatch during seed explicitly by just calling runDetectionCycle without IO
    console.log('Running detection cycle to calculate alerts...');
    const alerts = await runDetectionCycle();

    console.log(`✅ Detection cycle completed. Populated ${alerts.length} outbreak_alerts.`);
    for (const a of alerts) {
        console.log(`   - ${a.riskLevel.toUpperCase()} Alert: ${a.caseCount} cases in ${a.diseaseCategory} (geohash: ${a.geohash})`);
    }

    await sequelize.close();
}

runSeed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
