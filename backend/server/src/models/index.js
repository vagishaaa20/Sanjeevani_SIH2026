const User = require('./User');
const PatientProfile = require('./PatientProfile');
const DoctorProfile = require('./DoctorProfile');
const AdminProfile = require('./AdminProfile');

User.hasOne(PatientProfile, { foreignKey: 'userId', as: 'patientProfile', onDelete: 'CASCADE' });
User.hasOne(DoctorProfile, { foreignKey: 'userId', as: 'doctorProfile', onDelete: 'CASCADE' });
User.hasOne(AdminProfile, { foreignKey: 'userId', as: 'adminProfile', onDelete: 'CASCADE' });
PatientProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DoctorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AdminProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { User, PatientProfile, DoctorProfile, AdminProfile };