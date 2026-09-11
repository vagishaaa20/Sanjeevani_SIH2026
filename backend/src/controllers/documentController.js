const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { VerificationDocument, ProfessionalDocument } = require('../models');
const { VERIFICATION_DOC_STATUS } = require('../models/verificationDocumentModel');
const { DOCUMENT_TYPE } = require('../constants/roles');
const storageService = require('../services/verificationStorageService');
const env = require('../config/env');

// ── POST /api/documents ───────────────────────────────────────────────────────

/**
 * Authenticated Doctor or Health Worker uploads a verification PDF document.
 * Multipart form: file field "document", body field "documentType"
 */
async function uploadDocument(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please select a PDF verification document.' });
    }

    const { documentType } = req.body;
    if (!documentType) {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'documentType is required' });
    }

    try {
        // Read buffer to validate genuine PDF format
        const fileBuffer = fs.readFileSync(req.file.path);
        if (!storageService.validatePdfBuffer(fileBuffer)) {
            if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
            return res.status(400).json({ error: 'Invalid document format. Only valid PDF files are allowed.' });
        }

        const documentId = uuidv4();
        const roleFolder = req.user.role === 'health_worker' ? 'health-workers' : 'doctors';
        const storagePath = `${roleFolder}/${req.user.id}/${documentId}.pdf`;

        // Upload to private object storage
        await storageService.uploadVerificationPdf(fileBuffer, storagePath, req.file.mimetype || 'application/pdf');

        // Cleanup temporary multer upload file
        if (fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, () => {});
        }

        // Create verification_documents row
        const verDoc = await VerificationDocument.create({
            id: documentId,
            userId: req.user.id,
            role: req.user.role,
            documentType,
            fileName: req.file.originalname || `${documentType}.pdf`,
            storagePath,
            mimeType: req.file.mimetype || 'application/pdf',
            fileSize: req.file.size || fileBuffer.length,
            status: VERIFICATION_DOC_STATUS.PENDING,
            uploadedAt: new Date(),
        });

        // Also sync with professional_documents for legacy compat
        try {
            await ProfessionalDocument.create({
                id: documentId,
                ownerId: req.user.id,
                ownerRole: req.user.role,
                documentType,
                storageKey: storagePath,
                originalFileName: req.file.originalname,
                mimeType: req.file.mimetype || 'application/pdf',
                fileSizeBytes: req.file.size || fileBuffer.length,
                status: 'PENDING',
                uploadedAt: new Date(),
            });
        } catch (syncErr) {
            // Non-blocking
            console.warn('[uploadDocument] ProfessionalDocument sync warning:', syncErr.message);
        }

        const safeDoc = {
            id: verDoc.id,
            userId: verDoc.userId,
            role: verDoc.role,
            documentType: verDoc.documentType,
            fileName: verDoc.fileName,
            fileSize: verDoc.fileSize,
            status: verDoc.status,
            uploadedAt: verDoc.uploadedAt,
        };

        return res.status(201).json({
            message: 'Verification document uploaded successfully to private storage.',
            document: safeDoc,
        });
    } catch (err) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
        console.error('[uploadDocument] Error:', err);
        return res.status(500).json({ error: err.message || 'Failed to upload verification document' });
    }
}

// ── GET /api/documents/me ─────────────────────────────────────────────────────

/**
 * Authenticated user views their own submitted verification documents.
 */
async function listMyDocuments(req, res) {
    try {
        const docs = await VerificationDocument.findAll({
            where: { userId: req.user.id },
            attributes: [
                'id',
                'userId',
                'role',
                'documentType',
                'fileName',
                'fileSize',
                'status',
                'uploadedAt',
                'reviewedAt',
                'rejectionReason',
            ],
            order: [['uploadedAt', 'DESC']],
        });

        return res.json({ documents: docs });
    } catch (err) {
        console.error('[listMyDocuments] Error:', err);
        return res.status(500).json({ error: 'Failed to fetch your verification documents' });
    }
}

// ── GET /api/documents/:documentId/signed-url ──────────────────────────────────

/**
 * Generate short-lived signed URL for user to view their own document.
 */
async function getMyDocumentSignedUrl(req, res) {
    try {
        const doc = await VerificationDocument.findOne({
            where: { id: req.params.documentId, userId: req.user.id },
        });

        if (!doc) {
            return res.status(404).json({ error: 'Verification document not found' });
        }

        const signedUrl = await storageService.getSignedDocumentUrl(doc.storagePath, doc.id, 300);
        return res.json({ signedUrl, fileName: doc.fileName, mimeType: doc.mimeType });
    } catch (err) {
        console.error('[getMyDocumentSignedUrl] Error:', err);
        return res.status(500).json({ error: 'Failed to generate signed document URL' });
    }
}

// ── DELETE /api/documents/:documentId ─────────────────────────────────────────

/**
 * User deletes/replaces a document they haven't had approved yet.
 */
async function deleteMyDocument(req, res) {
    try {
        const doc = await VerificationDocument.findOne({
            where: { id: req.params.documentId, userId: req.user.id },
        });

        if (!doc) return res.status(404).json({ error: 'Document not found' });

        if (doc.status === VERIFICATION_DOC_STATUS.APPROVED) {
            return res.status(400).json({ error: 'Cannot delete an already approved verification document' });
        }

        await doc.destroy();
        await ProfessionalDocument.destroy({ where: { id: doc.id } }).catch(() => {});

        return res.json({ message: 'Document removed successfully' });
    } catch (err) {
        console.error('[deleteMyDocument] Error:', err);
        return res.status(500).json({ error: 'Failed to delete document' });
    }
}

// ── GET /api/documents/:documentId/signed-stream ──────────────────────────────

/**
 * Streaming endpoint for fallback signed token access
 */
async function serveSignedStream(req, res) {
    const { token } = req.query;
    if (!token) {
        return res.status(401).json({ error: 'Signed document token required' });
    }

    try {
        const secret = env.jwt.accessSecret || 'sanjeevani_doc_view_secret';
        const decoded = jwt.verify(token, secret);

        if (decoded.docId !== req.params.documentId || decoded.purpose !== 'verification_document_view') {
            return res.status(403).json({ error: 'Invalid document viewing token' });
        }

        const filePath = storageService.getLocalDocumentPath(decoded.storagePath);
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Document file not found in storage' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="verification-document.pdf"');
        const stream = fs.createReadStream(filePath);
        return stream.pipe(res);
    } catch (err) {
        console.error('[serveSignedStream] Error:', err.message);
        return res.status(403).json({ error: 'Document link expired or invalid. Please request a new preview.' });
    }
}

module.exports = {
    uploadDocument,
    listMyDocuments,
    getMyDocumentSignedUrl,
    deleteMyDocument,
    serveSignedStream,
};