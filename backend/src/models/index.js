const User = require('./userModel');
const AdminProfile = require('./AdminProfile');
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
const ConsultationDocument = require('./consultationDocumentModel');
const QueueSkipped = require('./queueSkippedModel');
const MedicineInventory = require('./medicineInventoryModel');
const HealthWorkerProfile = require('./healthWorkerProfileModel');
const HealthWorkerAssignment = require('./healthWorkerAssignmentModel');
const HealthWorkerFollowup = require('./healthWorkerFollowupModel');
const HealthWorkerReferral = require('./healthWorkerReferralModel');
const VerificationDocument = require('./verificationDocumentModel');
const DiagnosticRequest = require('./diagnosticRequestModel');
const HighRiskPatient = require('./highRiskPatientModel');
// ── User → profile associations (1:1, cascade delete) ────────────────────────
User.hasOne(PatientProfile, { foreignKey: 'userId', as: 'patientProfile', onDelete: 'CASCADE' });
User.hasOne(DoctorProfile, { foreignKey: 'userId', as: 'doctorProfile', onDelete: 'CASCADE' });
User.hasOne(ClinicProfile, { foreignKey: 'userId', as: 'clinicProfile', onDelete: 'CASCADE' });
User.hasOne(HealthWorkerProfile, { foreignKey: 'userId', as: 'healthWorkerProfile', onDelete: 'CASCADE' });

PatientProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DoctorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ClinicProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
HealthWorkerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── User → verification documents (1:many, cascade delete) ──────────────────────
User.hasMany(VerificationDocument, { foreignKey: 'userId', as: 'verificationDocuments', onDelete: 'CASCADE' });
VerificationDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });
VerificationDocument.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Backward compatible aliases
User.hasMany(ProfessionalDocument, { foreignKey: 'ownerId', as: 'documents', onDelete: 'CASCADE' });
ProfessionalDocument.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// ── Consultation associations ─────────────────────────────────────────────────
PatientProfile.hasMany(Consultation, { foreignKey: 'patientId', sourceKey: 'userId', as: 'consultations' });
Consultation.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patient' });

DoctorProfile.hasMany(Consultation, { foreignKey: 'doctorId', sourceKey: 'userId', as: 'consultations' });
Consultation.belongsTo(DoctorProfile, { foreignKey: 'doctorId', targetKey: 'userId', as: 'doctor' });

ClinicProfile.hasMany(Consultation, { foreignKey: 'clinicId', sourceKey: 'userId', as: 'consultations' });
Consultation.belongsTo(ClinicProfile, { foreignKey: 'clinicId', targetKey: 'userId', as: 'clinic' });

// ── DoctorReview associations ─────────────────────────────────────────────────
DoctorProfile.hasMany(DoctorReview, { foreignKey: 'doctorId', sourceKey: 'userId', as: 'reviews' });
DoctorReview.belongsTo(DoctorProfile, { foreignKey: 'doctorId', targetKey: 'userId', as: 'doctor' });

PatientProfile.hasMany(DoctorReview, { foreignKey: 'patientId', sourceKey: 'userId', as: 'reviews' });
DoctorReview.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patient' });

Consultation.hasOne(DoctorReview, { foreignKey: 'consultationId', as: 'review' });
DoctorReview.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });

// ── SubsidyApplication associations ──────────────────────────────────────────
PatientProfile.hasOne(SubsidyApplication, { foreignKey: 'patientId', sourceKey: 'userId', as: 'subsidyApplication' });
SubsidyApplication.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patient' });

// ── MedicationReminder associations ───────────────────────────────────────
PatientProfile.hasMany(MedicationReminder, { foreignKey: 'patientId', sourceKey: 'userId', as: 'medicationReminders' });
MedicationReminder.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patient' });

Consultation.hasMany(MedicationReminder, { foreignKey: 'consultationId', as: 'medicationReminders' });
MedicationReminder.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });

MedicationReminder.hasMany(MedicationLog, { foreignKey: 'reminderId', as: 'logs' });
MedicationLog.belongsTo(MedicationReminder, { foreignKey: 'reminderId', as: 'reminder' });

// ── DiseaseReport associations ────────────────────────────────────────────
PatientProfile.hasMany(DiseaseReport, { foreignKey: 'patientId', sourceKey: 'userId', as: 'diseaseReports' });
DiseaseReport.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patient' });

// ── ConsultationDocument associations ────────────────────────────────────
Consultation.hasMany(ConsultationDocument, { foreignKey: 'consultationId', as: 'documents' });
ConsultationDocument.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });
PatientProfile.hasMany(ConsultationDocument, { foreignKey: 'patientId', sourceKey: 'userId', as: 'documents' });
ConsultationDocument.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patient' });

// ── Medicine inventory associations ─────────────────────────────────────────
ClinicProfile.hasMany(MedicineInventory, { foreignKey: 'clinicId', sourceKey: 'userId', as: 'medicineInventory', onDelete: 'CASCADE' });
MedicineInventory.belongsTo(ClinicProfile, { foreignKey: 'clinicId', targetKey: 'userId', as: 'clinic' });

// ── Queue associations ───────────────────────────────────────────────────
Queue.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patient' });
PatientProfile.hasMany(Queue, { foreignKey: 'patientId', sourceKey: 'userId', as: 'queues' });
Queue.belongsTo(DoctorProfile, { foreignKey: 'doctorId', targetKey: 'userId', as: 'doctor' });
DoctorProfile.hasMany(Queue, { foreignKey: 'doctorId', sourceKey: 'userId', as: 'queues' });

// ── Appointment associations ───────────────────────────────────────────
Appointment.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patient' });
PatientProfile.hasMany(Appointment, { foreignKey: 'patientId', sourceKey: 'userId', as: 'appointments' });
Appointment.belongsTo(DoctorProfile, { foreignKey: 'doctorId', targetKey: 'userId', as: 'doctor' });
DoctorProfile.hasMany(Appointment, { foreignKey: 'doctorId', sourceKey: 'userId', as: 'appointments' });
Appointment.belongsTo(ClinicProfile, { foreignKey: 'clinicId', targetKey: 'userId', as: 'clinic' });
ClinicProfile.hasMany(Appointment, { foreignKey: 'clinicId', sourceKey: 'userId', as: 'appointments' });

// ── Health Worker associations ───────────────────────────────────────────
HealthWorkerAssignment.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
HealthWorkerAssignment.belongsTo(User, { foreignKey: 'healthWorkerId', as: 'healthWorker' });
HealthWorkerFollowup.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
HealthWorkerFollowup.belongsTo(User, { foreignKey: 'healthWorkerId', as: 'healthWorker' });
HealthWorkerReferral.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
HealthWorkerReferral.belongsTo(User, { foreignKey: 'referringHealthWorkerId', as: 'referringHealthWorker' });
HealthWorkerReferral.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });
HealthWorkerReferral.belongsTo(User, { foreignKey: 'fromClinicId', as: 'fromClinic' });
HealthWorkerReferral.belongsTo(User, { foreignKey: 'toClinicId', as: 'toClinic' });
HealthWorkerReferral.belongsTo(User, { foreignKey: 'toDoctorId', as: 'toDoctor' });

// ── Diagnostic Request associations ──────────────────────────────────────
DiagnosticRequest.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
DiagnosticRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
DiagnosticRequest.belongsTo(User, { foreignKey: 'clinicId', as: 'clinic' });

// ── High Risk Patient associations ───────────────────────────────────────────
HighRiskPatient.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
HighRiskPatient.belongsTo(User, { foreignKey: 'assignedHealthWorkerId', as: 'assignedHealthWorker' });
HighRiskPatient.belongsTo(User, { foreignKey: 'assignedDoctorId', as: 'assignedDoctor' });
PatientProfile.hasMany(HighRiskPatient, { foreignKey: 'patientId', sourceKey: 'userId', as: 'highRiskEpisodes' });
HighRiskPatient.belongsTo(PatientProfile, { foreignKey: 'patientId', targetKey: 'userId', as: 'patientProfile' });
module.exports = {
  User,
  AdminProfile,
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
  ConsultationDocument,
  QueueSkipped,
  MedicineInventory,
  HealthWorkerProfile,
  HealthWorkerAssignment,
  HealthWorkerFollowup,
  HealthWorkerReferral,
  VerificationDocument,
  DiagnosticRequest,
  HighRiskPatient,
};