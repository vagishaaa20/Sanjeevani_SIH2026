const { ProfessionalDocument } = require('../models');
const { DOCUMENT_TYPE, DOCUMENT_STATUS } = require('../constants/roles');
const fs = require('fs');
const path = require('path');

// ── POST /api/documents ───────────────────────────────────────────────────────

/**
 * Doctor uploads one document for verification.
 * multipart/form-data: file field name "document", plus body field "documentType"
 */
async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { documentType } = req.body;
  if (!documentType || !Object.values(DOCUMENT_TYPE).includes(documentType)) {
    // Clean up the file we just saved, since the request is invalid
    fs.unlink(req.file.path, () => { });
    return res.status(400).json({
      error: `documentType must be one of: ${Object.values(DOCUMENT_TYPE).join(', ')}`,
    });
  }

  const doc = await ProfessionalDocument.create({
    ownerId: req.user.id,
    ownerRole: req.user.role,
    documentType,
    storageKey: req.file.path,
    originalFileName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSizeBytes: req.file.size,
    status: DOCUMENT_STATUS.PENDING,
  });

  // Never return storageKey to the client
  const { storageKey, ...safeDoc } = doc.toJSON();

  return res.status(201).json({ message: 'Document uploaded', document: safeDoc });
}

// ── GET /api/documents/me ─────────────────────────────────────────────────────

/**
 * Doctor views their own submitted documents and statuses.
 */
async function listMyDocuments(req, res) {
  const docs = await ProfessionalDocument.findAll({
    where: { ownerId: req.user.id },
    attributes: { exclude: ['storageKey'] },
    order: [['createdAt', 'DESC']],
  });

  return res.json({ documents: docs });
}

// ── DELETE /api/documents/:documentId ─────────────────────────────────────────

/**
 * Doctor deletes/replaces a document they haven't had accepted yet.
 * (Accepted documents can't be deleted — resubmission should go through
 * a fresh upload once admin requests it.)
 */
async function deleteMyDocument(req, res) {
  const doc = await ProfessionalDocument.findOne({
    where: { id: req.params.documentId, ownerId: req.user.id },
  });
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (doc.status === DOCUMENT_STATUS.ACCEPTED) {
    return res.status(400).json({ error: 'Cannot delete an already-accepted document' });
  }

  // Remove the file from disk, then the DB row
  fs.unlink(doc.storageKey, (err) => {
    if (err) console.error('Failed to delete file from disk:', err.message);
  });
  await doc.destroy();

  return res.json({ message: 'Document deleted' });
}

module.exports = { uploadDocument, listMyDocuments, deleteMyDocument };