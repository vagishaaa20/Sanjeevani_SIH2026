const ROLES = Object.freeze({
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    FLW: 'flw',
    CLINIC_ADMIN: 'clinic_admin',
    HITL_REVIEWER: 'hitl_reviewer',
});

const ROLE_PERMISSIONS = Object.freeze({
    patient: ['profile:read', 'profile:update'],
    doctor: ['profile:read', 'profile:update', 'patients:read'],
    clinic_admin: ['profile:read', 'profile:update', 'clinic:manage'],
    admin: ['profile:read', 'profile:update', 'users:manage', 'verification:manage'],
    flw: ['profile:read', 'profile:update', 'triage:manage'],
    hitl_reviewer: ['profile:read', 'profile:update', 'cases:review'],
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

const PATIENT_STATUS = Object.freeze({
    REGISTERED: 'REGISTERED',
    PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
    PROFILE_COMPLETE: 'PROFILE_COMPLETE',
});

const VERIFICATION_STATUS = Object.freeze({
    PENDING_VERIFICATION: 'PENDING_VERIFICATION',
    UNDER_REVIEW: 'UNDER_REVIEW',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
    SUSPENDED: 'SUSPENDED',
});

const REVIEWER_CATEGORY = Object.freeze({
    REGISTERED_MEDICAL_PRACTITIONER: 'REGISTERED_MEDICAL_PRACTITIONER',
    POSTGRADUATE_RESIDENT: 'POSTGRADUATE_RESIDENT',
    MEDICAL_INTERN: 'MEDICAL_INTERN',
    OTHER: 'OTHER',
});

const DOCUMENT_TYPE = Object.freeze({
    MEDICAL_REGISTRATION_CERTIFICATE: 'MEDICAL_REGISTRATION_CERTIFICATE',
    MBBS_OR_PRIMARY_QUALIFICATION: 'MBBS_OR_PRIMARY_QUALIFICATION',
    INTERNSHIP_COMPLETION_CERTIFICATE: 'INTERNSHIP_COMPLETION_CERTIFICATE',
    GOVERNMENT_IDENTITY: 'GOVERNMENT_IDENTITY',
    PROFESSIONAL_PHOTOGRAPH: 'PROFESSIONAL_PHOTOGRAPH',
    PG_QUALIFICATION_CERTIFICATE: 'PG_QUALIFICATION_CERTIFICATE',
    ADDITIONAL_QUALIFICATION_PROOF: 'ADDITIONAL_QUALIFICATION_PROOF',
    COLLEGE_OR_INSTITUTION_ID: 'COLLEGE_OR_INSTITUTION_ID',
    RESIDENCY_PROOF: 'RESIDENCY_PROOF',
    INTERNSHIP_PROOF: 'INTERNSHIP_PROOF',
    SPECIALIZATION_PROOF: 'SPECIALIZATION_PROOF',
});

const DOCUMENT_STATUS = Object.freeze({
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
});

module.exports = {
    ROLES,
    ROLE_PERMISSIONS,
    ALL_ROLES,
    PATIENT_STATUS,
    VERIFICATION_STATUS,
    REVIEWER_CATEGORY,
    DOCUMENT_TYPE,
    DOCUMENT_STATUS,
};
