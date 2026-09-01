require('dotenv').config();
const { ClinicProfile, DoctorProfile } = require('../models');

async function main() {
    const clinicUserId = '2a7a13d9-5630-4eda-8bb5-f788d72fb230';

    // 1. Update clinic coordinates and and verify status
    const clinic = await ClinicProfile.findOne({ where: { userId: clinicUserId } });
    if (clinic) {
        await clinic.update({
            latitude: 22.77700000,
            longitude: 86.14400000,
            verificationStatus: 'VERIFIED'
        });
        console.log('Clinic coordinates and verified status updated successfully');
    } else {
        console.warn('Clinic profile not found');
    }

    // 2. Link doctors to this clinic and set as verified
    const doctorIds = [
        '62b58e97-b396-4235-a8ce-5e3781fdfee6', // Dr. Test
        '33db22e1-e20d-43aa-b48b-f01e14519dca'  // Dr. Sohail Khan
    ];

    for (const docId of doctorIds) {
        const doc = await DoctorProfile.findOne({ where: { userId: docId } });
        if (doc) {
            await doc.update({
                clinicId: clinicUserId,
                verificationStatus: 'VERIFIED',
                specialization: 'Cardiologist',
                consultationFee: 500,
                yearsOfExperience: 10
            });
            console.log(`Doctor ${doc.fullName} linked to clinic and set to VERIFIED`);
        } else {
            console.warn(`Doctor profile ${docId} not found`);
        }
    }

    console.log('Seed finished successfully.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
