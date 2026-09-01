require('dotenv').config();
const { User, PatientProfile, DoctorProfile, ClinicProfile } = require('../models');

async function main() {
    const users = await User.findAll({ raw: true });
    console.log('--- USERS ---');
    console.log(users.map(u => ({ id: u.id, email: u.email, phone: u.phone, role: u.role, isVerified: u.isVerified })));

    const patients = await PatientProfile.findAll({ raw: true });
    console.log('--- PATIENTS PROFILE ---');
    console.log(patients.map(p => ({ userId: p.userId, fullName: p.fullName, lat: p.latitude, lng: p.longitude, status: p.accountStatus })));

    const doctors = await DoctorProfile.findAll({ raw: true });
    console.log('--- DOCTORS PROFILE ---');
    console.log(doctors.map(d => ({ userId: d.userId, fullName: d.fullName, clinicId: d.clinicId, verificationStatus: d.verificationStatus, lat: d.latitude, lng: d.longitude })));

    const clinics = await ClinicProfile.findAll({ raw: true });
    console.log('--- CLINICS PROFILE ---');
    console.log(clinics.map(c => ({ userId: c.userId, name: c.clinicName, status: c.verificationStatus, lat: c.latitude, lng: c.longitude })));

    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
