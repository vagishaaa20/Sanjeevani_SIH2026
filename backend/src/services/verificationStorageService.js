const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

const BUCKET_NAME = process.env.SUPABASE_VERIFICATION_BUCKET || 'verification-documents';
const LOCAL_STORAGE_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'verification_documents');

// Ensure local directory exists
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

let _supabase = null;
let _bucketChecked = false;

function getSupabaseClient() {
    if (_supabase) return _supabase;

    const url = process.env.SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_ID || 'fnuvpwtavyjdozbqfyem'}.supabase.co`;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        return null;
    }

    try {
        _supabase = createClient(url, key, {
            auth: { persistSession: false },
        });
        return _supabase;
    } catch (err) {
        console.warn('[verificationStorageService] Supabase client init warning:', err.message);
        return null;
    }
}

async function ensurePrivateBucket(supabase) {
    if (_bucketChecked || !supabase) return;
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.warn('[verificationStorageService] listBuckets error:', error.message);
            return;
        }

        const found = buckets?.some((b) => b.name === BUCKET_NAME);
        if (!found) {
            console.log(`[verificationStorageService] Creating private bucket "${BUCKET_NAME}"...`);
            const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
                public: false, // NEVER public
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['application/pdf'],
            });
            if (createErr) {
                console.warn('[verificationStorageService] createBucket warning:', createErr.message);
            }
        }
        _bucketChecked = true;
    } catch (err) {
        console.warn('[verificationStorageService] Bucket check exception:', err.message);
    }
}

/**
 * Validate buffer is genuinely a PDF
 */
function validatePdfBuffer(buffer) {
    if (!buffer || buffer.length < 4) {
        return false;
    }
    // PDF Magic Bytes: %PDF (0x25 0x50 0x44 0x46)
    const header = buffer.toString('utf8', 0, 5);
    return header.startsWith('%PDF');
}

/**
 * Upload verification PDF to private storage
 * @param {Buffer} fileBuffer
 * @param {string} storagePath e.g. "doctors/uuid/docId.pdf"
 * @param {string} mimeType
 */
async function uploadVerificationPdf(fileBuffer, storagePath, mimeType = 'application/pdf') {
    if (!validatePdfBuffer(fileBuffer)) {
        throw new Error('Invalid file format. Uploaded file must be a valid PDF document.');
    }

    // 1. Save to secure local disk cache
    const localFullPath = path.join(LOCAL_STORAGE_DIR, storagePath);
    const localDir = path.dirname(localFullPath);
    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
    }
    fs.writeFileSync(localFullPath, fileBuffer);

    // 2. Upload to Supabase Private Storage if configured
    const supabase = getSupabaseClient();
    if (supabase) {
        await ensurePrivateBucket(supabase);
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileBuffer, {
                    contentType: mimeType,
                    upsert: true,
                });

            if (error) {
                console.warn(`[verificationStorageService] Supabase upload error (cached locally): ${error.message}`);
            }
        } catch (err) {
            console.warn(`[verificationStorageService] Supabase upload failed (cached locally): ${err.message}`);
        }
    }

    return {
        storagePath,
        bucket: BUCKET_NAME,
        size: fileBuffer.length,
    };
}

/**
 * Generate a short-lived signed URL (300 seconds / 5 minutes) to view the complete PDF
 * @param {string} storagePath
 * @param {string} documentId
 * @param {number} expiresInSeconds
 */
async function getSignedDocumentUrl(storagePath, documentId, expiresInSeconds = 300) {
    const supabase = getSupabaseClient();
    if (supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(storagePath, expiresInSeconds);

            if (!error && data?.signedUrl) {
                return data.signedUrl;
            }
            if (error) {
                console.warn('[verificationStorageService] createSignedUrl error:', error.message);
            }
        } catch (err) {
            console.warn('[verificationStorageService] Supabase signed URL exception:', err.message);
        }
    }

    // Fallback: Generate a signed token for backend secure streaming
    const secret = env.jwt.accessSecret || 'sanjeevani_doc_view_secret';
    const token = jwt.sign(
        {
            docId: documentId,
            storagePath,
            purpose: 'verification_document_view',
        },
        secret,
        { expiresIn: `${expiresInSeconds}s` }
    );

    return `/api/documents/${documentId}/signed-stream?token=${encodeURIComponent(token)}`;
}

/**
 * Get the local path of a stored document (for streaming)
 */
function getLocalDocumentPath(storagePath) {
    const localFullPath = path.join(LOCAL_STORAGE_DIR, storagePath);
    if (fs.existsSync(localFullPath)) {
        return localFullPath;
    }
    return null;
}

module.exports = {
    BUCKET_NAME,
    validatePdfBuffer,
    uploadVerificationPdf,
    getSignedDocumentUrl,
    getLocalDocumentPath,
};
