const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const {
    User,
    DoctorProfile,
    ClinicProfile,
    HealthWorkerProfile,
    ProfessionalDocument,
    VerificationDocument,
    PatientProfile,
    HealthWorkerAssignment,
} = require('../models');
const sequelize = require('../config/db');
const { VERIFICATION_STATUS, ROLES, DOCUMENT_STATUS } = require('../constants/roles');
const { VERIFICATION_DOC_STATUS } = require('../models/verificationDocumentModel');
const storageService = require('../services/verificationStorageService');

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
    [ROLES.HEALTH_WORKER]: HealthWorkerProfile,
};

// ── GET /api/admin/pending ────────────────────────────────────────────────────

async function listPending(req, res) {
    const pendingStatuses = {
        [Op.in]: [VERIFICATION_STATUS.PENDING_VERIFICATION, VERIFICATION_STATUS.UNDER_REVIEW],
    };

    const [doctors, clinics, healthWorkers] = await Promise.all([
        DoctorProfile.findAll({
            where: { verificationStatus: pendingStatuses },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'phone', 'isVerified', 'createdAt'],
                    include: [
                        {
                            model: VerificationDocument,
                            as: 'verificationDocuments',
                            required: false,
                        },
                    ],
                },
            ],
            order: [['createdAt', 'ASC']],
        }),
        ClinicProfile.findAll({
            where: { verificationStatus: pendingStatuses },
            include: [{ model: User, as: 'user', attributes: ['id', 'email', 'phone', 'isVerified', 'createdAt'] }],
            order: [['createdAt', 'ASC']],
        }),
        HealthWorkerProfile.findAll({
            where: { isVerified: false },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'phone', 'isVerified', 'createdAt'],
                    include: [
                        {
                            model: VerificationDocument,
                            as: 'verificationDocuments',
                            required: false,
                        },
                    ],
                },
            ],
            order: [['createdAt', 'ASC']],
        }),
    ]);

    return res.json({ doctors, clinics, healthWorkers });
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

async function getUserDetail(req, res) {
    const user = await User.findByPk(req.params.userId, {
        attributes: ['id', 'email', 'phone', 'role', 'isVerified', 'createdAt'],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profileModel = PROFILE_MODEL_BY_ROLE[user.role];
    const profile = profileModel ? await profileModel.findOne({ where: { userId: user.id } }) : null;

    // Fetch verification documents
    let documents = await VerificationDocument.findAll({
        where: { userId: user.id },
        order: [['uploadedAt', 'DESC']],
    });

    if (documents.length === 0) {
        // Fallback to legacy professional_documents
        documents = await ProfessionalDocument.findAll({
            where: { ownerId: user.id },
            attributes: { exclude: ['storageKey'] },
            order: [['createdAt', 'DESC']],
        });
    }

    return res.json({ user, profile, documents });
}

// ── GET /api/admin/verification-documents ────────────────────────────────────

/**
 * List verification document requests for Admin review.
 */
async function listVerificationRequests(req, res) {
    const { status, role } = req.query;
    const where = {};
    if (status) where.status = status;
    if (role) where.role = role;

    try {
        const docs = await VerificationDocument.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'phone', 'role', 'isVerified', 'createdAt'],
                    include: [
                        { model: DoctorProfile, as: 'doctorProfile', required: false },
                        { model: HealthWorkerProfile, as: 'healthWorkerProfile', required: false },
                        { model: ClinicProfile, as: 'clinicProfile', required: false },
                    ],
                },
            ],
            order: [['uploadedAt', 'DESC']],
        });

        return res.json({ documents: docs });
    } catch (err) {
        console.error('[listVerificationRequests] Error:', err);
        return res.status(500).json({ error: 'Failed to list verification requests' });
    }
}

// ── GET /api/admin/documents/:documentId/signed-url ───────────────────────────

/**
 * Generate temporary signed URL for admin to view full PDF
 */
async function getAdminDocumentSignedUrl(req, res) {
    try {
        let doc = await VerificationDocument.findByPk(req.params.documentId);
        let storagePath = doc ? doc.storagePath : null;

        if (!doc) {
            const legacyDoc = await ProfessionalDocument.findByPk(req.params.documentId);
            if (!legacyDoc) {
                return res.status(404).json({ error: 'Verification document not found' });
            }
            doc = legacyDoc;
            storagePath = legacyDoc.storageKey;
        }

        const signedUrl = await storageService.getSignedDocumentUrl(storagePath, doc.id, 300);

        return res.json({
            signedUrl,
            document: {
                id: doc.id,
                userId: doc.userId || doc.ownerId,
                role: doc.role || doc.ownerRole,
                documentType: doc.documentType,
                fileName: doc.fileName || doc.originalFileName,
                mimeType: doc.mimeType || 'application/pdf',
                status: doc.status,
                uploadedAt: doc.uploadedAt,
                rejectionReason: doc.rejectionReason,
            },
        });
    } catch (err) {
        console.error('[getAdminDocumentSignedUrl] Error:', err);
        return res.status(500).json({ error: 'Failed to generate signed document view URL' });
    }
}

// ── PATCH /api/admin/documents/:documentId ────────────────────────────────────

/**
 * Admin reviews (Approves / Rejects / Requests Resubmission) a verification document.
 */
async function reviewDocument(req, res) {
    const { status, rejectionReason, notes } = req.body;

    const normalizedStatus = status === 'ACCEPTED' ? 'APPROVED' : status;
    const validStatuses = ['APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'ACCEPTED'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            error: 'status must be one of: APPROVED, REJECTED, RESUBMISSION_REQUIRED',
        });
    }

    if ((normalizedStatus === 'REJECTED' || normalizedStatus === 'RESUBMISSION_REQUIRED') && !rejectionReason && !notes) {
        return res.status(400).json({
            error: 'rejectionReason is required when rejecting or requesting resubmission.',
        });
    }

    try {
        let doc = await VerificationDocument.findByPk(req.params.documentId);
        let targetUserId = null;

        if (doc) {
            targetUserId = doc.userId;
            await doc.update({
                status: normalizedStatus,
                reviewedAt: new Date(),
                reviewedBy: req.user.id,
                rejectionReason: rejectionReason || notes || null,
            });
        }

        // Also update legacy ProfessionalDocument if exists
        const legacyDoc = await ProfessionalDocument.findByPk(req.params.documentId);
        if (legacyDoc) {
            targetUserId = targetUserId || legacyDoc.ownerId;
            const auditEntry = {
                action: normalizedStatus.toLowerCase(),
                actorId: req.user.id,
                actorRole: req.user.role,
                timestamp: new Date().toISOString(),
                note: rejectionReason || notes || null,
            };
            await legacyDoc.update({
                status: normalizedStatus === 'APPROVED' ? 'ACCEPTED' : normalizedStatus,
                verifiedAt: new Date(),
                verifiedBy: req.user.id,
                auditLog: [...(legacyDoc.auditLog || []), auditEntry],
            });
        }

        if (!doc && !legacyDoc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Check if all mandatory documents for this user are approved
        if (normalizedStatus === 'APPROVED' && targetUserId) {
            const userDocs = await VerificationDocument.findAll({ where: { userId: targetUserId } });
            const allApproved = userDocs.length > 0 && userDocs.every((d) => d.status === 'APPROVED');

            if (allApproved) {
                const targetUser = await User.findByPk(targetUserId);
                if (targetUser) {
                    await targetUser.update({ isVerified: true });
                    const profileModel = PROFILE_MODEL_BY_ROLE[targetUser.role];
                    if (profileModel) {
                        await profileModel.update(
                            { verificationStatus: VERIFICATION_STATUS.VERIFIED, isVerified: true },
                            { where: { userId: targetUserId } }
                        );
                    }
                }
            }
        }

        return res.json({
            message: `Document marked as ${normalizedStatus}`,
            document: doc || legacyDoc,
        });
    } catch (err) {
        console.error('[reviewDocument] Error:', err);
        return res.status(500).json({ error: 'Failed to update document review status' });
    }
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
        return res.status(400).json({
            error: 'Verification is only applicable to doctor, clinic_admin, and health_worker accounts',
        });
    }

    const profile = await profileModel.findOne({ where: { userId: targetUser.id } });
    if (!profile) return res.status(404).json({ error: 'Profile not found for this user' });

    const newStatus = ACTION_TO_STATUS[action];
    const isApproving = action === 'approve';

    if (targetUser.role === ROLES.HEALTH_WORKER) {
        if (!isApproving) {
            await profile.update({ isVerified: false });
            await targetUser.update({ isVerified: false });
            return res.json({
                message: `User ${action} action applied successfully`,
                userId: targetUser.id,
                verificationStatus: newStatus,
            });
        }

        await sequelize.transaction(async (t) => {
            await profile.update({ isVerified: true }, { transaction: t });
            await targetUser.update({ isVerified: true }, { transaction: t });

            const hwCity = profile.district;
            if (hwCity && hwCity.trim() !== '') {
                const eligiblePatients = await PatientProfile.findAll({
                    where: {
                        region: { [Op.iLike]: hwCity.trim() },
                    },
                    attributes: ['userId'],
                    transaction: t,
                });

                const eligiblePatientIds = eligiblePatients.map((p) => p.userId);

                if (eligiblePatientIds.length > 0) {
                    const existingAssignments = await HealthWorkerAssignment.findAll({
                        where: {
                            patientId: { [Op.in]: eligiblePatientIds },
                            status: 'ACTIVE',
                        },
                        attributes: ['patientId'],
                        transaction: t,
                    });

                    const assignedPatientIds = new Set(existingAssignments.map((a) => a.patientId));
                    const unassignedPatientIds = eligiblePatientIds.filter((id) => !assignedPatientIds.has(id));

                    if (unassignedPatientIds.length > 0) {
                        const assignmentsToCreate = unassignedPatientIds.map((patientId) => ({
                            healthWorkerId: targetUser.id,
                            patientId,
                            assignedBy: req.user.id,
                            status: 'ACTIVE',
                        }));
                        await HealthWorkerAssignment.bulkCreate(assignmentsToCreate, { transaction: t });
                    }
                }
            }
        });

        return res.json({
            message: `User ${action} action applied successfully`,
            userId: targetUser.id,
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
        });
    }

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

// ── GET /api/admin/documents/:documentId/file ────────────────────────────────

async function serveDocument(req, res) {
    let doc = await VerificationDocument.findByPk(req.params.documentId);
    let filePath = null;

    if (doc) {
        filePath = storageService.getLocalDocumentPath(doc.storagePath);
    } else {
        const legacyDoc = await ProfessionalDocument.findByPk(req.params.documentId);
        if (legacyDoc) {
            filePath = path.resolve(legacyDoc.storageKey);
        }
    }

    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Document file not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    return res.sendFile(filePath);
}

module.exports = {
    listPending,
    listUsers,
    getUserDetail,
    verifyUser,
    listVerificationRequests,
    getAdminDocumentSignedUrl,
    reviewDocument,
    serveDocument,
};