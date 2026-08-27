const ROLES = Object.freeze({
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
});

const ROLE_PERMISSIONS = Object.freeze({
  patient: ['profile:read', 'profile:update'],
  doctor: ['profile:read', 'profile:update', 'patients:read'],
  admin: ['profile:read', 'profile:update', 'users:manage'],
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, ROLE_PERMISSIONS, ALL_ROLES };