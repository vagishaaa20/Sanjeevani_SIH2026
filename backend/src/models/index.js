const User = require('./User');
const PatientProfile = require('./PatientProfile');
const DoctorProfile = require('./DoctorProfile');
const AdminProfile = require('./AdminProfile');
const ReviewerProfile = require('./ReviewerProfile');
const ProfessionalDocument = require('./ProfessionalDocument');
const PatientRequest = require('./PatientRequest');

// ── User → profile associations (1:1, cascade delete) ────────────────────────
User.hasOne(PatientProfile, { foreignKey: 'userId', as: 'patientProfile', onDelete: 'CASCADE' });
User.hasOne(DoctorProfile, { foreignKey: 'userId', as: 'doctorProfile', onDelete: 'CASCADE' });
User.hasOne(AdminProfile, { foreignKey: 'userId', as: 'adminProfile', onDelete: 'CASCADE' });
User.hasOne(ReviewerProfile, { foreignKey: 'userId', as: 'reviewerProfile', onDelete: 'CASCADE' });

PatientProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DoctorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AdminProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ReviewerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── ProfessionalDocument: ownerId is a logical FK (no DB constraint) ──────────
// We intentionally avoid a DB-level FK here because ownerId can refer to either
// a doctor or a reviewer user. Referential integrity is enforced at the
// application layer (see documentController).
User.hasMany(ProfessionalDocument, { foreignKey: 'ownerId', as: 'documents' });
ProfessionalDocument.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(PatientRequest, { foreignKey: 'patientId', as: 'patientRequests' });
User.hasMany(PatientRequest, { foreignKey: 'doctorId', as: 'doctorRequests' });
PatientRequest.belongsTo(User, { foreignKey: 'patientId', as: 'patientUser' });
PatientRequest.belongsTo(User, { foreignKey: 'doctorId', as: 'doctorUser' });

module.exports = {
  User,
  PatientProfile,
  DoctorProfile,
  AdminProfile,
  ReviewerProfile,
  ProfessionalDocument,
  PatientRequest,
};