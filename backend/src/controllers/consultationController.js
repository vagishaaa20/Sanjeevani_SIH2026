const { Op } = require('sequelize');
const { Consultation, DoctorProfile, ClinicProfile, PatientProfile, DiseaseReport } = require('../models');
const { CONSULTATION_STATUS } = require('../models/consultationModel');
const { generateSummary } = require('../services/summaryService');
const { mapDiseaseCategory } = require('../services/triageService');
const ngeohash = require('ngeohash');
const { runDetectionCycle } = require('../services/outbreakDetectionService');
const { generatePrescriptionPdf } = require('../services/prescriptionPdfService');
const { computeCanonicalHash, anchorOnChain, verifyOnChain } = require('../services/blockchainService');
const pdfParse = require('pdf-parse');

/**
 * GET /api/consultations/me
 * Returns all consultations for the logged-in patient, paginated, most-recent first.
 * Joins doctor name, specialization and clinic name.
 */
async function getMyConsultations(req, res) {
    const patientId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await Consultation.findAndCountAll({
            where: { patientId },
            include: [
                {
                    model: DoctorProfile,
                    as: 'doctor',
                    attributes: ['userId', 'fullName', 'specialization', 'consultationFee'],
                },
                {
                    model: ClinicProfile,
                    as: 'clinic',
                    attributes: ['userId', 'clinicName', 'address', 'city'],
                    required: false,
                },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        return res.json({
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            consultations: rows,
        });
    } catch (err) {
        console.error('[getMyConsultations] error:', err);
        return res.status(500).json({ error: 'Failed to fetch consultations' });
    }
}

/**
 * GET /api/consultations/:id/rejoin
 * Returns room info for an in-progress consultation belonging to the patient.
 */
async function rejoinCall(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;

    try {
        const consultation = await Consultation.findOne({
            where: { id, patientId },
        });

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        if (consultation.status !== CONSULTATION_STATUS.IN_PROGRESS) {
            return res.status(400).json({
                error: 'This consultation is not currently in progress',
                status: consultation.status,
            });
        }

        return res.json({
            consultationId: consultation.id,
            roomId: consultation.roomId,
            doctorId: consultation.doctorId,
        });
    } catch (err) {
        console.error('[rejoinCall] error:', err);
        return res.status(500).json({ error: 'Failed to fetch call info' });
    }
}

/**
 * POST /api/consultations/:id/summary
 * Generates (or returns cached) AI plain-language summary for a completed consultation.
 *
 * Cache logic:
 *   - If aiSummary exists AND aiSummaryGeneratedAt > updatedAt: return cached summary.
 *   - Otherwise: call Gemini, store result.
 *   - If no notes/prescriptionText: return { aiSummary: null } — don't call Gemini.
 */
async function generateAiSummary(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;

    try {
        const consultation = await Consultation.findOne({ where: { id, patientId } });

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        if (consultation.status !== CONSULTATION_STATUS.COMPLETED) {
            return res.status(400).json({ error: 'Summary only available for completed consultations' });
        }

        const notesText = consultation.prescriptionText || consultation.notes;
        if (!notesText?.trim()) {
            return res.json({ aiSummary: null, cached: false, reason: 'no_notes' });
        }

        // Cache hit: summary exists and was generated after the last update
        const isStale =
            !consultation.aiSummaryGeneratedAt ||
            new Date(consultation.aiSummaryGeneratedAt) < new Date(consultation.updatedAt);

        if (consultation.aiSummary && !isStale) {
            return res.json({ aiSummary: consultation.aiSummary, cached: true });
        }

        // Generate new summary
        const summary = await generateSummary(notesText);

        await consultation.update({
            aiSummary: summary,
            aiSummaryGeneratedAt: new Date(),
        });

        // Write 'confirmed' disease report
        try {
            const patient = await PatientProfile.findByPk(patientId);
            if (patient && patient.latitude && patient.longitude) {
                const diseaseCategory = mapDiseaseCategory(summary, notesText);
                const gh = ngeohash.encode(patient.latitude, patient.longitude, 5);

                await DiseaseReport.create({
                    patientId,
                    consultationId: consultation.id,
                    doctorId: consultation.doctorId,
                    diseaseCategory,
                    symptomTags: [notesText.slice(0, 500)], // store snippet for context
                    geohash: gh,
                    source: 'manual',
                    severityScore: 2, // Default to a moderate severity since doctor confirmed it
                    confidenceLevel: 'confirmed'
                });

                runDetectionCycle().catch(err => console.error('[outbreakDetection] Error:', err.message));
            }
        } catch (reportErr) {
            console.error('[generateAiSummary] Error creating confirmed disease report:', reportErr.message);
        }

        return res.json({ aiSummary: summary, cached: false });
    } catch (err) {
        console.error('[generateAiSummary] error:', err);
        return res.status(500).json({ error: 'Failed to generate summary' });
    }
}

/**
 * POST /api/consultations/:id/end
 * Allows a patient to manually hang up/terminate their active consultation.
 * This explicitly closes the queue entry so it no longer loops on the dashboard.
 */
async function endCallByPatient(req, res) {
    try {
        const { id } = req.params;
        const consultation = await Consultation.findByPk(id);

        if (!consultation || consultation.patientId !== req.user.id) {
            return res.status(404).json({ error: 'Consultation not found or unauthorized' });
        }

        // Only mark it completed if it's currently active in some form
        if (['assigned', 'in_progress', 'disconnected'].includes(consultation.status)) {
            consultation.status = 'completed';
            consultation.webrtcStatus = 'completed';
            await consultation.save();

            // Clear the queue tracking row
            const { Queue } = require('../models');
            const queue = await Queue.findOne({ where: { patientId: consultation.patientId, doctorId: consultation.doctorId, status: 'SERVING' } });
            if (queue) {
                queue.status = 'COMPLETED';
                await queue.save();
            }

            // Prune dangling socket disconnect timers
            const timers = req.app.get('disconnectTimers');
            if (timers && timers.has(consultation.roomId)) {
                clearTimeout(timers.get(consultation.roomId));
                timers.delete(consultation.roomId);
            }

            // Immediately notify the remote doctor directly so they are cleanly kicked out
            const io = req.app.get('io');
            if (io) {
                io.to(`user:${consultation.doctorId}`).emit('consultation:completed', { consultationId: id });
            }
        }

        return res.json({ success: true, message: 'Consultation ended successfully' });
    } catch (err) {
        console.error('[endCallByPatient] error:', err);
        return res.status(500).json({ error: 'Failed to end call' });
    }
}

/**
 * GET /api/consultations/timeline
 * Returns chronological symptom timeline for the logged-in patient.
 * Each entry includes: date, reportedSymptoms, doctor name/specialization, aiSummary if available.
 */
async function getTimeline(req, res) {
    const patientId = req.user.id;

    try {
        const consultations = await Consultation.findAll({
            where: {
                patientId,
                status: { [Op.in]: [CONSULTATION_STATUS.COMPLETED, CONSULTATION_STATUS.IN_PROGRESS] },
            },
            include: [
                {
                    model: DoctorProfile,
                    as: 'doctor',
                    attributes: ['fullName', 'specialization'],
                },
            ],
            order: [['createdAt', 'ASC']],
            attributes: [
                'id',
                'createdAt',
                'scheduledAt',
                'status',
                'reportedSymptoms',
                'aiSummary',
                'notes',
            ],
        });

        const timeline = consultations.map((c) => ({
            consultationId: c.id,
            date: c.scheduledAt || c.createdAt,
            reportedSymptoms: c.reportedSymptoms || null,
            doctor: c.doctor?.fullName || 'Doctor',
            specialization: c.doctor?.specialization || null,
            diagnosis: c.aiSummary || (c.notes ? c.notes.slice(0, 200) : null),
            status: c.status,
        }));

        return res.json({ timeline });
    } catch (err) {
        console.error('[getTimeline] error:', err);
        return res.status(500).json({ error: 'Failed to fetch timeline' });
    }
}

/**
 * POST /api/consultations/:id/complete
 * Officially completes a consultation, storing true clinical documentation.
 */
async function completeConsultation(req, res) {
    try {
        const { id: consultationId } = req.params;
        const { notes, finalDiagnosis, prescriptionText, severityScore } = req.body;
        const doctorId = req.user.id;

        const consultation = await Consultation.findByPk(consultationId);
        if (!consultation || consultation.doctorId !== doctorId) {
            return res.status(404).json({ error: 'Consultation not found or unauthorized' });
        }

        if (!notes?.trim() && !finalDiagnosis?.trim()) {
            return res.status(400).json({ error: 'Doctor notes or a final diagnosis are required to complete the consultation.' });
        }

        consultation.notes = notes;
        consultation.finalDiagnosis = finalDiagnosis;
        consultation.prescriptionText = prescriptionText;
        consultation.status = 'completed';
        consultation.webrtcStatus = 'completed';

        await consultation.save();

        // Mark original Queue entry as COMPLETED
        const { Queue } = require('../models');
        const queue = await Queue.findOne({ where: { patientId: consultation.patientId, doctorId, status: 'SERVING' } });
        if (queue) {
            queue.status = 'COMPLETED';
            await queue.save();
        }

        // WebRTC cleanup
        const timers = req.app.get('disconnectTimers');
        if (timers && timers.has(consultation.roomId)) {
            clearTimeout(timers.get(consultation.roomId));
            timers.delete(consultation.roomId);
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`user:${consultation.patientId}`).emit('consultation:completed', {
                consultationId: consultation.id
            });
        }

        // --- ASYNC DOWNSTREAM (AI Summary + Outbreak Signal + PDF + Blockchain) ---
        (async () => {
            try {
                const textToSummarize = `${notes || ''} ${prescriptionText || ''}`.trim();
                let summary = finalDiagnosis || '';

                // 1. AI Summary
                try {
                    if (textToSummarize) {
                        summary = await generateSummary(textToSummarize);
                        await consultation.update({
                            aiSummary: summary,
                            aiSummaryGeneratedAt: new Date()
                        });
                    } else if (finalDiagnosis) {
                        await consultation.update({
                            aiSummary: finalDiagnosis,
                            aiSummaryGeneratedAt: new Date()
                        });
                    }
                } catch (summaryErr) {
                    console.error('[completeConsultation] Summary generation failed:', summaryErr.message);
                }

                // 2. Fetch doctor + patient for PDF
                const patient = await PatientProfile.findByPk(consultation.patientId);
                const doctor = await DoctorProfile.findByPk(consultation.doctorId);

                // 3. Compute canonical hash immediately (before PDF — decoupled from PDF bytes)
                const completedAt = consultation.updatedAt || new Date();
                const hashHex = computeCanonicalHash(
                    consultation.id,
                    consultation.doctorId,
                    consultation.patientId,
                    finalDiagnosis || '',
                    prescriptionText || '',
                    completedAt
                );
                await consultation.update({ prescriptionHash: hashHex });
                console.log('[PDF] Canonical hash computed:', hashHex.slice(0, 18) + '...');

                // 4. Generate PDF (with QR code embedded)
                try {
                    if (doctor && patient) {
                        const { fileUrl } = await generatePrescriptionPdf({
                            consultation: consultation.toJSON ? consultation.toJSON() : consultation,
                            doctor: doctor.toJSON ? doctor.toJSON() : doctor,
                            patient: patient.toJSON ? patient.toJSON() : patient,
                        });
                        await consultation.update({ prescriptionUrl: fileUrl });
                        console.log('[PDF] Prescription PDF generated and uploaded');
                    }
                } catch (pdfErr) {
                    console.error('[PDF] PDF generation failed (non-blocking):', pdfErr.message);
                }

                // 5. Blockchain anchoring — fully async/non-blocking for PDF availability
                (async () => {
                    try {
                        const txHash = await anchorOnChain(hashHex);
                        const contractAddress = process.env.PRESCRIPTION_ANCHOR_ADDRESS || null;
                        await consultation.update({ blockchainTxHash: txHash, contractAddress });
                        console.log('[Blockchain] Prescription anchored. Tx:', txHash);
                    } catch (anchorErr) {
                        console.error('[Blockchain] Anchoring failed (non-blocking):', anchorErr.message);
                    }
                })();

                // 6. Outbreak Mapping
                console.log('[DEBUG] Patient Profile:', !!patient, 'Lat/Lng:', patient?.latitude, patient?.longitude);
                if (patient && patient.latitude && patient.longitude) {
                    const diseaseCategory = mapDiseaseCategory(finalDiagnosis, textToSummarize);
                    console.log('[DEBUG] Mapped Category:', diseaseCategory);

                    const gh = ngeohash.encode(patient.latitude, patient.longitude, 5);
                    const parsedSeverity = severityScore ? parseInt(severityScore) : 2;
                    const sScore = isNaN(parsedSeverity) ? 2 : parsedSeverity;

                    await DiseaseReport.create({
                        patientId: patient.userId,
                        consultationId: consultation.id,
                        doctorId: consultation.doctorId,
                        diseaseCategory,
                        symptomTags: [textToSummarize.slice(0, 499)],
                        geohash: gh,
                        source: 'manual',
                        severityScore: sScore,
                        confidenceLevel: 'confirmed'
                    });
                    console.log('[DEBUG] Disease report effectively recorded');
                    runDetectionCycle().catch(err => console.error('[outbreakDetection] Background err:', err));
                }

            } catch (bgErr) {
                console.error('[completeConsultation] Background task error:', bgErr);
            }
        })();

        return res.json({ success: true, consultation });
    } catch (err) {
        console.error('[completeConsultation] error:', err);
        return res.status(500).json({ error: 'Failed to complete consultation' });
    }
}
/**
 * GET /api/consultations/:id/prescription
 * Returns prescription PDF URL and blockchain verification status for a completed consultation.
 * Patient-only, ownership verified.
 */
async function getPrescriptionPdf(req, res) {
    const patientId = req.user.id;
    const { id } = req.params;

    try {
        const consultation = await Consultation.findOne({
            where: { id, patientId },
            attributes: [
                'id', 'prescriptionUrl', 'prescriptionHash',
                'blockchainTxHash', 'contractAddress', 'status',
                'finalDiagnosis', 'prescriptionText', 'updatedAt'
            ],
        });

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        if (consultation.status !== CONSULTATION_STATUS.COMPLETED) {
            return res.status(400).json({ error: 'Prescription only available for completed consultations' });
        }

        let blockchainStatus = 'not_anchored';
        if (consultation.blockchainTxHash) blockchainStatus = 'verified';
        else if (consultation.prescriptionHash) blockchainStatus = 'pending';

        return res.json({
            prescriptionUrl: consultation.prescriptionUrl || null,
            prescriptionHash: consultation.prescriptionHash || null,
            blockchainTxHash: consultation.blockchainTxHash || null,
            contractAddress: consultation.contractAddress || null,
            blockchainStatus,
            explorerUrl: consultation.blockchainTxHash
                ? `https://amoy.polygonscan.com/tx/${consultation.blockchainTxHash}`
                : null,
        });
    } catch (err) {
        console.error('[getPrescriptionPdf] error:', err);
        return res.status(500).json({ error: 'Failed to fetch prescription info' });
    }
}

/**
 * GET /api/verify/:consultationId  (PUBLIC — no auth)
 * Recomputes the canonical hash from stored fields and verifies it against the smart contract.
 * Used by the public verification page.
 */
async function verifyPrescription(req, res) {
    const { consultationId } = req.params;

    try {
        const consultation = await Consultation.findByPk(consultationId, {
            attributes: [
                'id', 'doctorId', 'patientId', 'finalDiagnosis',
                'prescriptionText', 'prescriptionHash', 'blockchainTxHash',
                'contractAddress', 'updatedAt', 'status',
            ],
        });

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' });
        }

        if (consultation.status !== CONSULTATION_STATUS.COMPLETED) {
            return res.status(400).json({ error: 'Consultation not completed yet' });
        }

        if (!consultation.prescriptionHash) {
            return res.json({
                verified: false,
                status: 'no_hash',
                message: 'No prescription hash on record — PDF may not have been generated yet.',
            });
        }

        // Recompute hash from stored fields to detect tampering
        const recomputedHash = computeCanonicalHash(
            consultation.id,
            consultation.doctorId,
            consultation.patientId,
            consultation.finalDiagnosis || '',
            consultation.prescriptionText || '',
            consultation.updatedAt
        );

        if (recomputedHash !== consultation.prescriptionHash) {
            return res.json({
                verified: false,
                status: 'hash_mismatch',
                message: 'Hash mismatch — the stored record has been tampered with.',
                storedHash: consultation.prescriptionHash,
                recomputedHash,
            });
        }

        // If no tx hash yet, we can confirm hash integrity but can't verify on-chain
        if (!consultation.blockchainTxHash) {
            return res.json({
                verified: false,
                status: 'pending',
                message: 'Hash is intact but blockchain anchoring is still pending.',
                prescriptionHash: consultation.prescriptionHash,
            });
        }

        // Query the contract
        let onChain = null;
        try {
            onChain = await verifyOnChain(consultation.prescriptionHash);
        } catch (chainErr) {
            console.error('[verifyPrescription] On-chain query failed:', chainErr.message);
            // Return partial result — off-chain hash match is still useful
            return res.json({
                verified: false,
                status: 'chain_unreachable',
                message: 'Could not reach blockchain RPC. Hash is locally intact.',
                prescriptionHash: consultation.prescriptionHash,
                blockchainTxHash: consultation.blockchainTxHash,
                explorerUrl: `https://amoy.polygonscan.com/tx/${consultation.blockchainTxHash}`,
            });
        }

        if (!onChain.exists) {
            return res.json({
                verified: false,
                status: 'not_found_on_chain',
                message: 'Hash not found on the smart contract. Anchoring may have failed.',
                prescriptionHash: consultation.prescriptionHash,
            });
        }

        return res.json({
            verified: true,
            status: 'verified',
            message: 'Prescription is authentic and blockchain-verified.',
            prescriptionHash: consultation.prescriptionHash,
            blockchainTxHash: consultation.blockchainTxHash,
            contractAddress: consultation.contractAddress,
            anchoredBy: onChain.anchoredBy,
            anchoredAt: new Date(onChain.timestamp * 1000).toISOString(),
            explorerUrl: `https://amoy.polygonscan.com/tx/${consultation.blockchainTxHash}`,
        });
    } catch (err) {
        console.error('[verifyPrescription] error:', err);
        return res.status(500).json({ error: 'Verification failed' });
    }
}

/**
 * GET /api/consultations/active
 * Returns ongoing consultations for the logged-in doctor.
 */
async function getActiveConsultations(req, res) {
    const doctorId = req.user.id;
    try {
        const consultations = await Consultation.findAll({
            where: {
                doctorId,
                status: { [Op.in]: ['assigned', 'in_progress'] }
            },
            include: [
                {
                    model: PatientProfile,
                    as: 'patient',
                    attributes: ['fullName', 'dateOfBirth']
                }
            ],
            order: [['createdAt', 'ASC']]
        });
        return res.json({ consultations });
    } catch (err) {
        console.error('[getActiveConsultations] error:', err);
        return res.status(500).json({ error: 'Failed to fetch active consultations' });
    }
}

/**
 * POST /api/verify/upload
 * Accepts a PDF file upload, extracts text, finds UUID, and returns it.
 */
async function extractPdfUUID(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    try {
        const data = await pdfParse(req.file.buffer);
        const text = data.text;

        // Match standard UUID v4 format
        const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
        const match = text.match(uuidRegex);

        if (match && match[0]) {
            return res.json({ consultationId: match[0].toLowerCase() });
        } else {
            return res.status(400).json({ error: 'Could not extract consultation ID from PDF' });
        }
    } catch (err) {
        console.error('[extractPdfUUID] error:', err);
        return res.status(500).json({ error: 'Failed to process PDF' });
    }
}

module.exports = { getMyConsultations, rejoinCall, generateAiSummary, getTimeline, endCallByPatient, completeConsultation, getActiveConsultations, getPrescriptionPdf, verifyPrescription, extractPdfUUID };
