'use strict';

/**
 * prescriptionPdfService.js
 *
 * Generates a blockchain-stamped prescription PDF using PDFKit.
 *
 * Two-pass approach:
 *   Pass 1: build PDF without QR → caller hashes the fields
 *   Pass 2: caller provides QR PNG buffer → regenerate PDF with QR stamped in footer
 *
 * Storage: uploads to Supabase Storage using SUPABASE_URL + SUPABASE_SERVICE_KEY.
 * If Supabase is not configured, falls back to a base64 data-URL (dev mode).
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

// ── Supabase client (lazy) ────────────────────────────────────────────────────
let _supabase = null;
function getSupabase() {
    if (_supabase) return _supabase;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) return null;
    _supabase = createClient(url, key);
    return _supabase;
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'consultation-documents';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://sanjeevani.app';

// ── Colour palette (matches Sanjeevani brand) ─────────────────────────────────
const TEAL = '#0d9488';
const INK = '#1a1a1a';
const MUTED = '#6b7280';
const DIVIDER = '#e5e7eb';
const LIGHT_BG = '#f0fdfa';

/**
 * Build a complete PDF buffer.
 *
 * @param {object} opts
 * @param {object} opts.consultation   Sequelize Consultation instance or plain object
 * @param {object} opts.doctor         DoctorProfile plain object
 * @param {object} opts.patient        PatientProfile plain object
 * @param {Buffer|null} opts.qrBuffer  PNG buffer for QR code (null for pass-1)
 * @returns {Promise<Buffer>}
 */
function buildPdfBuffer({ consultation, doctor, patient, qrBuffer = null }) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const contentWidth = pageWidth - 100; // 50px margin each side

        // ── HEADER ──────────────────────────────────────────────────────────────
        // Teal left accent bar
        doc.rect(0, 0, 8, doc.page.height).fill(TEAL);

        // Logo / brand name
        doc
            .fontSize(24)
            .font('Helvetica-Bold')
            .fillColor(TEAL)
            .text('Sanjeevani', 60, 40, { continued: false });

        doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor(MUTED)
            .text('Digital Health Platform · Blockchain-Verified Prescription', 60, 68);

        // Divider
        doc.moveTo(60, 90).lineTo(pageWidth - 50, 90).strokeColor(DIVIDER).lineWidth(1).stroke();

        // ── DOCUMENT TITLE ──────────────────────────────────────────────────────
        doc
            .rect(60, 100, contentWidth, 30)
            .fill(LIGHT_BG);

        doc
            .fontSize(13)
            .font('Helvetica-Bold')
            .fillColor(INK)
            .text('MEDICAL PRESCRIPTION', 65, 109, { width: contentWidth - 10 });

        // ── DOCTOR INFO ─────────────────────────────────────────────────────────
        let y = 148;

        doc.fontSize(9).font('Helvetica-Bold').fillColor(TEAL).text('PRESCRIBED BY', 60, y);
        y += 14;

        doc
            .fontSize(13)
            .font('Helvetica-Bold')
            .fillColor(INK)
            .text(`Dr. ${doctor.fullName || 'Doctor'}`, 60, y);
        y += 17;

        const specialization = doctor.specialization || '';
        const mrn = doctor.medicalRegistrationNumber || '';
        const council = doctor.stateMedicalCouncil || '';

        if (specialization) {
            doc.fontSize(10).font('Helvetica').fillColor(MUTED).text(specialization, 60, y);
            y += 13;
        }
        if (mrn) {
            doc.fontSize(9).font('Helvetica').fillColor(MUTED)
                .text(`Registration No: ${mrn}${council ? '  ·  ' + council : ''}`, 60, y);
            y += 13;
        }

        // Divider
        y += 6;
        doc.moveTo(60, y).lineTo(pageWidth - 50, y).strokeColor(DIVIDER).lineWidth(0.5).stroke();
        y += 12;

        // ── PATIENT INFO ────────────────────────────────────────────────────────
        doc.fontSize(9).font('Helvetica-Bold').fillColor(TEAL).text('PATIENT DETAILS', 60, y);
        y += 14;

        const consultDate = (consultation.scheduledAt || consultation.createdAt)
            ? new Date(consultation.scheduledAt || consultation.createdAt)
                .toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
            : 'N/A';

        doc.fontSize(10).font('Helvetica').fillColor(INK)
            .text(`Name:  ${patient.fullName || 'Patient'}`, 60, y);
        y += 13;

        doc.text(`Date:   ${consultDate}`, 60, y);
        y += 13;

        const dob = patient.dateOfBirth
            ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : null;
        if (dob) {
            doc.text(`DOB:   ${dob}`, 60, y);
            y += 13;
        }

        // Divider
        y += 6;
        doc.moveTo(60, y).lineTo(pageWidth - 50, y).strokeColor(DIVIDER).lineWidth(0.5).stroke();
        y += 12;

        // ── DIAGNOSIS ────────────────────────────────────────────────────────────
        if (consultation.finalDiagnosis) {
            doc.fontSize(9).font('Helvetica-Bold').fillColor(TEAL).text('DIAGNOSIS', 60, y);
            y += 14;

            doc
                .rect(60, y, contentWidth, 1) // just for spacing ref
                .fill('transparent');

            doc.fontSize(11).font('Helvetica').fillColor(INK)
                .text(consultation.finalDiagnosis.trim(), 60, y, { width: contentWidth, lineGap: 3 });
            y = doc.y + 10;
        }

        // Divider
        doc.moveTo(60, y).lineTo(pageWidth - 50, y).strokeColor(DIVIDER).lineWidth(0.5).stroke();
        y += 12;

        // ── PRESCRIPTION TEXT ────────────────────────────────────────────────────
        doc.fontSize(9).font('Helvetica-Bold').fillColor(TEAL).text('℞ PRESCRIPTION', 60, y);
        y += 14;

        const rxText = consultation.prescriptionText || consultation.notes || 'No specific medications prescribed.';

        // Render each line as a separate medication entry for readability
        const rxLines = rxText.split('\n').map(l => l.trim()).filter(Boolean);
        rxLines.forEach((line) => {
            doc.fontSize(10).font('Helvetica').fillColor(INK)
                .text(`• ${line}`, 66, doc.y, { width: contentWidth - 6, lineGap: 2 });
        });
        y = doc.y + 16;

        // ── DOCTOR SIGNATURE LINE ────────────────────────────────────────────────
        doc.moveTo(60, y).lineTo(250, y).strokeColor(INK).lineWidth(0.5).stroke();
        y += 5;
        doc.fontSize(9).font('Helvetica').fillColor(MUTED)
            .text(`Dr. ${doctor.fullName || ''}  ·  Signature`, 60, y);
        y += 24;

        // ── FOOTER — Verification & QR stamp ────────────────────────────────────
        const footerY = doc.page.height - 120;

        doc.moveTo(60, footerY).lineTo(pageWidth - 50, footerY)
            .strokeColor(TEAL).lineWidth(1).stroke();

        doc.fontSize(8).font('Helvetica-Bold').fillColor(TEAL)
            .text('BLOCKCHAIN VERIFICATION', 60, footerY + 8);

        doc.fontSize(7.5).font('Helvetica').fillColor(MUTED)
            .text(
                `This prescription is cryptographically anchored on Polygon Amoy. ` +
                `Scan the QR code or visit the URL below to verify its authenticity and detect any tampering.`,
                60, footerY + 20,
                { width: qrBuffer ? contentWidth - 90 : contentWidth, lineGap: 2 }
            );

        const verifyUrl = `${APP_BASE_URL}/verify/${consultation.id}`;
        doc.fontSize(7.5).font('Helvetica').fillColor(TEAL)
            .text(verifyUrl, 60, footerY + 48, { width: contentWidth - 90 });

        if (consultation.blockchainTxHash) {
            doc.fontSize(7).font('Helvetica').fillColor(MUTED)
                .text(`Tx: ${consultation.blockchainTxHash}`, 60, footerY + 60, { width: contentWidth - 90 });
        }

        // QR code image (pass 2 only)
        if (qrBuffer) {
            const qrSize = 72;
            doc.image(qrBuffer, pageWidth - 50 - qrSize, footerY + 6, { width: qrSize, height: qrSize });
        }

        doc.end();
    });
}

/**
 * Main export: generate a prescription PDF with embedded QR code and optionally upload.
 *
 * @param {object} opts
 * @param {object} opts.consultation
 * @param {object} opts.doctor
 * @param {object} opts.patient
 * @returns {Promise<{ fileUrl: string, fileName: string }>}
 */
async function generatePrescriptionPdf({ consultation, doctor, patient }) {
    // Pass 1 — generate without QR (only needed to confirm layout; hash is computed separately)
    // Generate QR code buffer
    const verifyUrl = `${APP_BASE_URL}/verify/${consultation.id}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        type: 'png',
        width: 200,
        margin: 1,
        color: { dark: '#0d9488', light: '#ffffff' },
    });

    // Pass 2 — final PDF with QR stamped
    const pdfBuffer = await buildPdfBuffer({ consultation, doctor, patient, qrBuffer });

    const fileName = `prescription_${consultation.id}_${Date.now()}.pdf`;

    // ── Upload to Supabase Storage ───────────────────────────────────────────
    const supabase = getSupabase();
    if (supabase) {
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .upload(`prescriptions/${fileName}`, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true,
            });

        if (error) {
            throw new Error(`Supabase upload failed: ${error.message}`);
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(`prescriptions/${fileName}`);

        return { fileUrl: urlData.publicUrl, fileName };
    }

    // Fallback: base64 data URL (dev/testing when Supabase not configured)
    console.warn('[prescriptionPdfService] Supabase not configured — returning base64 data URL');
    const base64 = pdfBuffer.toString('base64');
    const b64DataUrl = `data:application/pdf;base64,${base64}`;
    console.log(`[prescriptionPdfService] Generated Base64 URL (Length: ${b64DataUrl.length})`);
    return {
        fileUrl: b64DataUrl,
        fileName,
    };
}

module.exports = { generatePrescriptionPdf };
