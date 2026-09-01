const User = require('./userModel');
const PatientProfile = require('./patientModel');
const DoctorProfile = require('./doctorModel');
const ClinicProfile = require('./clinicModel');
const Appointment = require('./appointmentModel');
const Queue = require('./queueModel');
const Encounter = require('./encounterModel');
const Facility = require('./facilityModel');
const ProfessionalDocument = require('./professionalDocumentModel');
const { Consultation } = require('./consultationModel');
const DoctorReview = require('./doctorReviewModel');
const { SubsidyApplication } = require('./subsidyApplicationModel');
const WhatsappLog = require('./whatsappLogModel');
const WhatsappSession = require('./whatsappSessionModel');
const { MedicationReminder } = require('./medicationReminderModel');
const MedicationLog = require('./medicationLogModel');
const DiseaseReport = require('./diseaseReportModel');
const OutbreakAlert = require('./outbreakAlertModel');

// ── User → profile associations (1:1, cascade delete) ────────────────────────
User.hasOne(PatientProfile, { foreignKey: 'userId', as: 'patientProfile', onDelete: 'CASCADE' });
User.hasOne(DoctorProfile, { foreignKey: 'userId', as: 'doctorProfile', onDelete: 'CASCADE' });
User.hasOne(ClinicProfile, { foreignKey: 'userId', as: 'clinicProfile', onDelete: 'CASCADE' });

PatientProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DoctorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ClinicProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── User → documents (1:many, cascade delete) ────────────────────────────────
User.hasMany(ProfessionalDocument, { foreignKey: 'ownerId', as: 'documents', onDelete: 'CASCADE' });
ProfessionalDocument.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// ── Consultation associations ─────────────────────────────────────────────────
PatientProfile.hasMany(Consultation, { foreignKey: 'patientId', as: 'consultations' });
Consultation.belongsTo(PatientProfile, { foreignKey: 'patientId', as: 'patient' });

DoctorProfile.hasMany(Consultation, { foreignKey: 'doctorId', as: 'consultations' });
Consultation.belongsTo(DoctorProfile, { foreignKey: 'doctorId', as: 'doctor' });

ClinicProfile.hasMany(Consultation, { foreignKey: 'clinicId', as: 'consultations' });
Consultation.belongsTo(ClinicProfile, { foreignKey: 'clinicId', as: 'clinic' });

// ── DoctorReview associations ─────────────────────────────────────────────────
DoctorProfile.hasMany(DoctorReview, { foreignKey: 'doctorId', as: 'reviews' });
DoctorReview.belongsTo(DoctorProfile, { foreignKey: 'doctorId', as: 'doctor' });

PatientProfile.hasMany(DoctorReview, { foreignKey: 'patientId', as: 'reviews' });
DoctorReview.belongsTo(PatientProfile, { foreignKey: 'patientId', as: 'patient' });

Consultation.hasOne(DoctorReview, { foreignKey: 'consultationId', as: 'review' });
DoctorReview.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });

// ── SubsidyApplication associations ──────────────────────────────────────────
PatientProfile.hasOne(SubsidyApplication, { foreignKey: 'patientId', as: 'subsidyApplication' });
SubsidyApplication.belongsTo(PatientProfile, { foreignKey: 'patientId', as: 'patient' });

// ── MedicationReminder associations ───────────────────────────────────────
PatientProfile.hasMany(MedicationReminder, { foreignKey: 'patientId', as: 'medicationReminders' });
MedicationReminder.belongsTo(PatientProfile, { foreignKey: 'patientId', as: 'patient' });

Consultation.hasMany(MedicationReminder, { foreignKey: 'consultationId', as: 'medicationReminders' });
MedicationReminder.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });

MedicationReminder.hasMany(MedicationLog, { foreignKey: 'reminderId', as: 'logs' });
MedicationLog.belongsTo(MedicationReminder, { foreignKey: 'reminderId', as: 'reminder' });

// ── DiseaseReport associations ────────────────────────────────────────────
PatientProfile.hasMany(DiseaseReport, { foreignKey: 'patientId', as: 'diseaseReports' });
DiseaseReport.belongsTo(PatientProfile, { foreignKey: 'patientId', as: 'patient' });

module.exports = {
  User,
  PatientProfile,
  DoctorProfile,
  ClinicProfile,
  Appointment,
  Queue,
  Encounter,
  Facility,
  ProfessionalDocument,
  Consultation,
  DoctorReview,
  SubsidyApplication,
  WhatsappLog,
  WhatsappSession,
  MedicationReminder,
  MedicationLog,
  DiseaseReport,
  OutbreakAlert,
};