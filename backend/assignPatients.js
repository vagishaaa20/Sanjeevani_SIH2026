const { User, HealthWorkerAssignment, HighRiskPatient } = require('./src/models');
const sequelize = require('./src/config/db');

async function assignAllPatients() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find our test health worker
        const hw = await User.findOne({ where: { email: 'worker@sanjeevani.gov.in' } });
        if (!hw) {
            console.log('Health worker not found!');
            process.exit(1);
        }

        // Find all patients
        const patients = await User.findAll({ where: { role: 'patient' } });
        console.log(`Found ${patients.length} patients.`);

        for (const patient of patients) {
            // Check if assignment already exists
            const existing = await HealthWorkerAssignment.findOne({
                where: { healthWorkerId: hw.id, patientId: patient.id }
            });

            if (!existing) {
                await HealthWorkerAssignment.create({
                    healthWorkerId: hw.id,
                    patientId: patient.id,
                    assignedBy: hw.id,
                    status: 'ACTIVE'
                });
                console.log(`Assigned patient ${patient.email} to health worker.`);
            }
        }

        // Also make sure all high risk patients are assigned to this HW
        await HighRiskPatient.update(
            { assignedHealthWorkerId: hw.id },
            { where: {} } // update all
        );
        console.log('Updated HighRiskPatient assignedHealthWorkerId for all records.');

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

assignAllPatients();
