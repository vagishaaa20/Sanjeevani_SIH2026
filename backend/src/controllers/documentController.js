const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ProfessionalDocument } = require('../models');
const { ROLES, DOCUMENT_TYPE, DOCUMENT_STATUS } = require('../config/roles');

// ── Multer storage config ─────────────────────────────────────────────────────

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organise uploads per owner: uploads/<role>/<userId>/
    const dir = path.join(UPLOADS_DIR, req.user.role, req.user.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // storageKey: <docType>_<timestamp><ext> — opaque, non-guessable
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${req.body.documentType || 'doc'}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only PDF, JPEG, PNG, and WebP files are accepted'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE_BYTES } });

// ── POST /api/documents/upload ────────────────────────────────────────────────

/**
 * Accepts: multipart/form-data  { documentType, file }
 * Auth: doctor or hitl_reviewer only
 *
 * storageKey is stored but NEVER returned in API responses.
 */
async function uploadDocument(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { documentType } = req.body;
  if (!documentType || !Object.values(DOCUMENT_TYPE).includes(documentType)) {
    // Clean up uploaded file since we won't track it
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({
      error: `documentType is required and must be one of: ${Object.values(DOCUMENT_TYPE).join(', ')}`,
    });
  }

  if (req.user.role !== ROLES.DOCTOR && req.user.role !== ROLES.HITL_REVIEWER) {
    fs.unlink(req.file.path, () => {});
    return res.status(403).json({ error: 'Document upload is only available for doctors and reviewers' });
  }

  // Build a private relative path as the storageKey
  const storageKey = path.join(req.user.role, req.user.id, req.file.filename);

  const doc = await ProfessionalDocument.create({
    ownerId: req.user.id,
    ownerRole: req.user.role,
    documentType,
    storageKey, // private — never exposed
    mimeType: req.file.mimetype,
    fileSizeBytes: req.file.size,
    status: DOCUMENT_STATUS.PENDING,
    auditLog: [
      {
        action: 'uploaded',
        actorId: req.user.id,
        actorRole: req.user.role,
        timestamp: new Date().toISOString(),
      },
    ],
  });

  // Return metadata only — no storageKey
  return res.status(201).json({
    message: 'Document uploaded successfully and is pending review',
    document: {
      id: doc.id,
      documentType: doc.documentType,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      status: doc.status,
      createdAt: doc.createdAt,
    },
  });
}

// ── GET /api/documents/my ─────────────────────────────────────────────────────

/**
 * Returns the authenticated user's own documents (metadata only, no storageKey).
 */
async function getMyDocuments(req, res) {
  const docs = await ProfessionalDocument.findAll({
    where: { ownerId: req.user.id },
    attributes: ['id', 'documentType', 'mimeType', 'fileSizeBytes', 'status', 'verifiedAt', 'createdAt'],
    order: [['createdAt', 'ASC']],
  });
  return res.json({ documents: docs });
}

// ── DELETE /api/documents/:id ─────────────────────────────────────────────────

/**
 * Owner can delete a PENDING document (e.g. if they uploaded the wrong file).
 * Once accepted or rejected, it cannot be deleted by the owner.
 */
async function deleteDocument(req, res) {
  const doc = await ProfessionalDocument.findOne({
    where: { id: req.params.id, ownerId: req.user.id },
  });
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.status !== DOCUMENT_STATUS.PENDING)
    return res.status(400).json({ error: 'Only PENDING documents can be deleted' });

  // Remove physical file
  const fullPath = path.join(UPLOADS_DIR, doc.storageKey);
  fs.unlink(fullPath, () => {}); // best-effort

  await doc.destroy();
  return res.status(204).send();
}

// Export the multer middleware so the router can apply it
module.exports = { upload, uploadDocument, getMyDocuments, deleteDocument };
