const { Op } = require('sequelize');
const { User, DoctorProfile, ReviewerProfile, ProfessionalDocument, PatientRequest, PatientProfile } = require('../models');
const { VERIFICATION_STATUS, ROLES, DOCUMENT_STATUS } = require('../config/roles');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Allowed verification actions and their resulting verificationStatus values.
 */
const ACTION_TO_STATUS = {
  approve: VERIFICATION_STATUS.VERIFIED,
  reject: VERIFICATION_STATUS.REJECTED,
  suspend: VERIFICATION_STATUS.SUSPENDED,
  request_resubmission: VERIFICATION_STATUS.UNDER_REVIEW,
  set_under_review: VERIFICATION_STATUS.UNDER_REVIEW,
};

// ── GET /api/admin/pending ────────────────────────────────────────────────────

/**
 * Returns all doctors and HITL reviewers whose verificationStatus is
 * PENDING_VERIFICATION or UNDER_REVIEW, sorted oldest-first.
 *
 * Does NOT return document storageKeys.
 */
async function listPending(req, res) {
  const [doctors, reviewers] = await Promise.all([
    DoctorProfile.findAll({
      where: {
        verificationStatus: {
          [Op.in]: [VERIFICATION_STATUS.PENDING_VERIFICATION, VERIFICATION_STATUS.UNDER_REVIEW],
        },
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone', 'isVerified', 'createdAt'] }],
      order: [['createdAt', 'ASC']],
    }),
    ReviewerProfile.findAll({
      where: {
        verificationStatus: {
          [Op.in]: [VERIFICATION_STATUS.PENDING_VERIFICATION, VERIFICATION_STATUS.UNDER_REVIEW],
        },
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone', 'isVerified', 'createdAt'] }],
      order: [['createdAt', 'ASC']],
    }),
  ]);

  return res.json({ doctors, reviewers });
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────

/**
 * List all users with optional filters: role, verificationStatus, page/limit.
 */
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
 * Get a single user with their full role-specific profile.
 * Document storageKeys are NOT returned — only document metadata.
 */
async function getUserDetail(req, res) {
  const user = await User.findByPk(req.params.userId, {
    attributes: ['id', 'email', 'phone', 'role', 'isVerified', 'createdAt'],
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let profile = null;
  if (user.role === ROLES.DOCTOR) {
    profile = await DoctorProfile.findOne({ where: { userId: user.id } });
  } else if (user.role === ROLES.HITL_REVIEWER) {
    profile = await ReviewerProfile.findOne({ where: { userId: user.id } });
  }

  // Documents: return metadata only, strip storageKey
  const rawDocs = await ProfessionalDocument.findAll({
    where: { ownerId: user.id },
    attributes: ['id', 'documentType', 'mimeType', 'fileSizeBytes', 'status', 'verifiedAt', 'uploadedAt', 'createdAt'],
  });

  return res.json({ user, profile, documents: rawDocs });
}

// ── PATCH /api/admin/verify/:userId ──────────────────────────────────────────

/**
 * Perform a verification action on a doctor or HITL reviewer.
 * Body: { action*, notes }
 *
 * action: 'approve' | 'reject' | 'suspend' | 'request_resubmission' | 'set_under_review'
 *
 * When approved:
 *  - verificationStatus → VERIFIED
 *  - User.isVerified → true
 *  - For HITL reviewers: admin can also set allowedActions, supervisionRequired,
 *    specialityScope, reviewLevel in the same request.
 */
async function verifyUser(req, res) {
  const { action, notes, allowedActions, supervisionRequired, specialityScope, reviewLevel } = req.body;

  if (!action || !ACTION_TO_STATUS[action])
    return res.status(400).json({
      error: `Invalid action. Must be one of: ${Object.keys(ACTION_TO_STATUS).join(', ')}`,
    });

  const targetUser = await User.findByPk(req.params.userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  if (targetUser.role !== ROLES.DOCTOR && targetUser.role !== ROLES.HITL_REVIEWER)
    return res.status(400).json({ error: 'Verification is only applicable to doctor and hitl_reviewer accounts' });

  const newStatus = ACTION_TO_STATUS[action];
  const isApproving = action === 'approve';
  const now = new Date();

  const profileModel = targetUser.role === ROLES.DOCTOR ? DoctorProfile : ReviewerProfile;
  const profile = await profileModel.findOne({ where: { userId: targetUser.id } });
  if (!profile) return res.status(404).json({ error: 'Profile not found for this user' });

  const profileUpdates = {
    verificationStatus: newStatus,
    verifiedBy: req.user.id,
    verifiedAt: now,
    verificationNotes: notes || null,
  };

  // Reviewer-specific scope fields — only set when approving
  if (isApproving && targetUser.role === ROLES.HITL_REVIEWER) {
    if (allowedActions !== undefined) profileUpdates.allowedActions = allowedActions;
    if (supervisionRequired !== undefined) profileUpdates.supervisionRequired = supervisionRequired;
    if (specialityScope !== undefined) profileUpdates.specialityScope = specialityScope;
    if (reviewLevel !== undefined) profileUpdates.reviewLevel = reviewLevel;
  }

  await profile.update(profileUpdates);

  // Mark the user as verified/unverified based on action
  await targetUser.update({ isVerified: isApproving });

  return res.json({
    message: `User ${action} action applied successfully`,
    userId: targetUser.id,
    verificationStatus: newStatus,
  });
}

// ── PATCH /api/admin/documents/:documentId ────────────────────────────────────

/**
 * Accept or reject a specific document during the review process.
 * Body: { status*, notes }  status: 'ACCEPTED' | 'REJECTED'
 */
async function reviewDocument(req, res) {
  const { status, notes } = req.body;
  if (!status || !Object.values(DOCUMENT_STATUS).includes(status))
    return res.status(400).json({ error: `status must be one of: ${Object.values(DOCUMENT_STATUS).join(', ')}` });

  const doc = await ProfessionalDocument.findByPk(req.params.documentId, {
    attributes: { exclude: ['storageKey'] }, // never return storageKey
  });
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

  // Re-fetch without storageKey for the response
  const updated = await ProfessionalDocument.findByPk(req.params.documentId, {
    attributes: { exclude: ['storageKey'] },
  });

  return res.json({ message: 'Document status updated', document: updated });
}

// ── GET /api/admin/requests ──────────────────────────────────────────────────
async function listAllRequests(req, res) {
  try {
    const list = await PatientRequest.findAll({
      include: [
        {
          model: User,
          as: 'patientUser',
          attributes: ['id', 'email', 'phone'],
          include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName'] }]
        },
        {
          model: User,
          as: 'doctorUser',
          attributes: ['id', 'email', 'phone'],
          include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: ['fullName'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json({ requests: list });
  } catch (err) {
    console.error('Error listing all requests for admin:', err);
    return res.status(500).json({ error: 'Server error listing all patient requests.' });
  }
}

module.exports = { listPending, listUsers, getUserDetail, verifyUser, reviewDocument, listAllRequests };
