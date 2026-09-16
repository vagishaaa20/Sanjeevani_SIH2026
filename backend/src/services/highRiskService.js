const { HighRiskPatient, HealthWorkerAssignment } = require('../models');

async function processHighRiskTriage(patientId, severityScore, riskReason) {
    if (!patientId || severityScore < 2) return;

    try {
        let activeEpisode = await HighRiskPatient.findOne({
            where: {
                patientId,
                status: ['IDENTIFIED', 'MONITORING', 'ESCALATED', 'REFERRED']
            }
        });

        if (!activeEpisode) {
            const assignment = await HealthWorkerAssignment.findOne({
                where: { patientId, status: 'ACTIVE' }
            });

            await HighRiskPatient.create({
                patientId,
                riskLevel: 'HIGH',
                riskReason,
                status: 'IDENTIFIED',
                assignedHealthWorkerId: assignment ? assignment.healthWorkerId : null
            });
        } else {
            activeEpisode.riskReason = riskReason;
            await activeEpisode.save();
        }
    } catch (err) {
        console.error('[processHighRiskTriage] Error:', err);
    }
}

module.exports = { processHighRiskTriage };
