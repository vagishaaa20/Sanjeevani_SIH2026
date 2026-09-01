const { Op } = require('sequelize');
const path = require('path');
const { User, DoctorProfile, ClinicProfile, ProfessionalDocument } = require('../models');
const { VERIFICATION_STATUS, ROLES, DOCUMENT_STATUS } = require('../constants/roles');

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACTION_TO_STATUS = {
  approve: VERIFICATION_STATUS.VERIFIED,
  reject: VERIFICATION_STATUS.REJECTED,
  suspend: VERIFICATION_STATUS.SUSPENDED,
  request_resubmission: VERIFICATION_STATUS.UNDER_REVIEW,
  set_under_review: VERIFICATION_STATUS.UNDER_REVIEW,
};

const PROFILE_MODEL_BY_ROLE = {
  [ROLES.DOCTOR]: DoctorProfile,
  [ROLES.CLINIC_ADMIN]: ClinicProfile,
};

// ── GET /api/admin/pending ────────────────────────────────────────────────────

async function listPending(req, res) {
  const pendingStatuses = {
    [Op.in]: [VERIFICATION_STATUS.PENDING_VERIFICATION, VERIFICATION_STATUS.UNDER_REVIEW],
  };

  const [doctors, clinics] = await Promise.all([
    DoctorProfile.findAll({
      where: { verificationStatus: pendingStatuses },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone', 'isVerified', 'createdAt'] }],
      order: [['createdAt', 'ASC']],
    }),
    ClinicProfile.findAll({
      where: { verificationStatus: pendingStatuses },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone', 'isVerified', 'createdAt'] }],
      order: [['createdAt', 'ASC']],
    }),
  ]);

  return res.json({ doctors, clinics });
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────

async function listUsers(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.role) where.role = req.query.role;

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'email', 'phone', 'role', 'isVerified', 'createdAt'],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return res.json({ total: count, page, limit, users: rows });
}

// ── GET /api/admin/users/:userId ──────────────────────────────────────────────

/**
 * Now includes the user's submitted documents (metadata only, no storageKey)
 * so admin can review identity/license proof alongside the profile.
 */
async function getUserDetail(req, res) {
  const user = await User.findByPk(req.params.userId, {
    attributes: ['id', 'email', 'phone', 'role', 'isVerified', 'createdAt'],
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const profileModel = PROFILE_MODEL_BY_ROLE[user.role];
  const profile = profileModel ? await profileModel.findOne({ where: { userId: user.id } }) : null;

  const documents = await ProfessionalDocument.findAll({
    where: { ownerId: user.id },
    attributes: { exclude: ['storageKey'] },
    order: [['createdAt', 'DESC']],
  });

  return res.json({ user, profile, documents });
}

// ── PATCH /api/admin/verify/:userId ──────────────────────────────────────────

async function verifyUser(req, res) {
  const { action, notes } = req.body;

  if (!action || !ACTION_TO_STATUS[action]) {
    return res.status(400).json({
      error: `Invalid action. Must be one of: ${Object.keys(ACTION_TO_STATUS).join(', ')}`,
    });
  }

  const targetUser = await User.findByPk(req.params.userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const profileModel = PROFILE_MODEL_BY_ROLE[targetUser.role];
  if (!profileModel) {
    return res.status(400).json({ error: 'Verification is only applicable to doctor and clinic_admin accounts' });
  }

  const profile = await profileModel.findOne({ where: { userId: targetUser.id } });
  if (!profile) return res.status(404).json({ error: 'Profile not found for this user' });

  const newStatus = ACTION_TO_STATUS[action];
  const isApproving = action === 'approve';

  await profile.update({
    verificationStatus: newStatus,
    verifiedBy: req.user.id,
    verifiedAt: new Date(),
    verificationNotes: notes || null,
  });

  await targetUser.update({ isVerified: isApproving });

  return res.json({
    message: `User ${action} action applied successfully`,
    userId: targetUser.id,
    verificationStatus: newStatus,
  });
}

// ── PATCH /api/admin/documents/:documentId ────────────────────────────────────

/**
 * Accept or reject a specific document during review.
 * Body: { status*, notes }  status: 'ACCEPTED' | 'REJECTED'
 */
async function reviewDocument(req, res) {
  const { status, notes } = req.body;
  if (!status || !Object.values(DOCUMENT_STATUS).includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${Object.values(DOCUMENT_STATUS).join(', ')}` });
  }

  const doc = await ProfessionalDocument.findByPk(req.params.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const auditEntry = {
    action: status === DOCUMENT_STATUS.ACCEPTED ? 'accepted' : 'rejected',
    actorId: req.user.id,
    actorRole: req.user.role,
    timestamp: new Date().toISOString(),
    note: notes || null,
  };

  await doc.update({
    status,
    verifiedAt: new Date(),
    verifiedBy: req.user.id,
    auditLog: [...(doc.auditLog || []), auditEntry],
  });

  const { storageKey, ...safeDoc } = doc.toJSON();
  return res.json({ message: 'Document status updated', document: safeDoc });
}

// ── GET /api/admin/documents/:documentId/file ────────────────────────────────

/**
 * Stream the actual document file to the admin browser.
 * Never exposes the storageKey to non-admin callers — this route is
 * already gated behind authenticate + requireRole('admin').
 */
async function serveDocument(req, res) {
  const doc = await ProfessionalDocument.findByPk(req.params.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const absolutePath = path.resolve(doc.storageKey);
  return res.sendFile(absolutePath, (err) => {
    if (err) {
      console.error('[adminController] serveDocument error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: 'Could not serve file' });
    }
  });
}

module.exports = { listPending, listUsers, getUserDetail, verifyUser, reviewDocument, serveDocument };