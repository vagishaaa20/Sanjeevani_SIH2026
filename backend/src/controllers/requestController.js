const { PatientRequest, User, DoctorProfile, PatientProfile, ReviewerProfile, TriageCorrection } = require('../models');
const { performClinicalTriage } = require('../services/aiTriageService');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ── Attachment Upload Config for Patient Requests ──────────────────────────────
const PATIENT_UPLOADS_DIR = path.resolve(__dirname, '../../uploads/patient');
if (!fs.existsSync(PATIENT_UPLOADS_DIR)) fs.mkdirSync(PATIENT_UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userDir = path.join(PATIENT_UPLOADS_DIR, String(req.user.id));
        if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${cleanName}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, WebP images and PDF documents are allowed.'));
    }
};

const uploadAttachmentMulter = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// ── POST /api/requests/upload-attachment ──────────────────────────────────────
async function uploadAttachment(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const relativeUrl = `/uploads/patient/${req.user.id}/${req.file.filename}`;
        const type = req.body.attachmentType || (req.file.mimetype === 'application/pdf' ? 'old_prescription' : 'affected_area');

        return res.status(201).json({
            message: 'Attachment uploaded successfully',
            attachment: {
                url: relativeUrl,
                filename: req.file.originalname,
                storedName: req.file.filename,
                mimetype: req.file.mimetype,
                sizeBytes: req.file.size,
                type
            }
        });
    } catch (err) {
        console.error('Upload attachment error:', err);
        return res.status(500).json({ error: 'Failed to upload attachment.' });
    }
}

// ── POST /api/requests/ai-triage-preview ──────────────────────────────────────
async function previewTriage(req, res) {
    try {
        const { symptoms, duration, painLevel, affectedArea, requirement, location } = req.body;

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({ error: 'Symptoms description is required.' });
        }

        const patientProfile = await PatientProfile.findOne({ where: { userId: req.user.id } });

        const triage = await performClinicalTriage({
            symptoms,
            duration,
            painLevel,
            affectedArea,
            requirement: requirement || 'Doctor Consultation',
            patientProfile: patientProfile ? patientProfile.toJSON() : {},
            attachmentCount: (req.body.attachments || []).length
        });

        // Also create / record the live request in PENDING_HITL_REVIEW status with 15-min countdown
        const loc = location || patientProfile?.region || 'Delhi';
        const request = await PatientRequest.create({
            patientId: req.user.id,
            symptoms,
            location: loc,
            requirement: requirement || 'General Doctor Consultation',
            duration: duration || null,
            painLevel: painLevel ? parseInt(painLevel, 10) : null,
            affectedArea: affectedArea || null,
            attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
            triageCategory: triage.triageCategory,
            triageReasoning: triage.clinicalReasoning,
            triageAnalysis: triage,
            originalAiAnalysis: triage,
            hitlStatus: 'PENDING',
            hitlTimerExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15-minute countdown
            status: 'PENDING',
            latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
            longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
        });

        return res.status(201).json({
            message: 'AI Triage completed and queued for HITL validation.',
            triage,
            request
        });
    } catch (err) {
        console.error('Preview triage error:', err);
        return res.status(500).json({ error: 'Failed to compute clinical triage preview.' });
    }
}

// ── GET /api/requests/my ──────────────────────────────────────────────────────
async function listMyRequests(req, res) {
    try {
        const list = await PatientRequest.findAll({
            where: { patientId: req.user.id },
            include: [
                {
                    model: User,
                    as: 'doctorUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: ['fullName', 'specialization', 'clinicOrHospital'] }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // Check if any pending request has expired past its 15-min window
        const now = new Date();
        for (const item of list) {
            if (item.hitlStatus === 'PENDING' && item.hitlTimerExpiresAt && new Date(item.hitlTimerExpiresAt) <= now) {
                item.hitlStatus = 'TIMEOUT_FALLBACK';
                item.hitlOverrideNotes = '15-minute HITL audit window elapsed. Teleconsultation option automatically unlocked.';
                await item.save();
            }
        }

        return res.json({ requests: list });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error retrieving requests.' });
    }
}

// ── POST /api/requests ────────────────────────────────────────────────────────
async function createRequest(req, res) {
    const {
        symptoms,
        location,
        requirement,
        duration,
        painLevel,
        affectedArea,
        attachments,
        latitude,
        longitude
    } = req.body;

    if (!symptoms || !location) {
        return res.status(400).json({ error: 'Symptoms and Location are required fields.' });
    }

    try {
        const patientProfile = await PatientProfile.findOne({ where: { userId: req.user.id } });

        const triage = await performClinicalTriage({
            symptoms,
            duration,
            painLevel,
            affectedArea,
            requirement: requirement || 'General Doctor Consultation',
            patientProfile: patientProfile ? patientProfile.toJSON() : {},
            attachmentCount: (attachments || []).length
        });

        const request = await PatientRequest.create({
            patientId: req.user.id,
            symptoms,
            location,
            requirement: requirement || 'General Doctor Consultation',
            duration: duration || null,
            painLevel: painLevel ? parseInt(painLevel, 10) : null,
            affectedArea: affectedArea || null,
            attachments: Array.isArray(attachments) ? attachments : [],
            triageCategory: triage.triageCategory,
            triageReasoning: triage.clinicalReasoning,
            triageAnalysis: triage,
            originalAiAnalysis: triage,
            hitlStatus: 'PENDING',
            hitlTimerExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15-minute timer
            status: 'PENDING',
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
        });

        return res.status(201).json({
            message: 'Request created and triaged successfully.',
            request,
            triage
        });
    } catch (err) {
        console.error('Create request error:', err);
        return res.status(500).json({ error: 'Server error creating clinical request.' });
    }
}

// ── GET /api/requests/hitl/queue ──────────────────────────────────────────────
async function listHitlQueue(req, res) {
    try {
        const tab = req.query.tab || 'pending';
        const now = new Date();

        // 1. Auto-expire any pending requests where the 15-min countdown has lapsed
        try {
            await PatientRequest.update(
                {
                    hitlStatus: 'TIMEOUT_FALLBACK',
                    hitlOverrideNotes: '15-minute HITL audit window elapsed. Auto-unlocked for direct teleconsultation.'
                },
                {
                    where: {
                        hitlStatus: 'PENDING',
                        status: 'PENDING',
                        hitlTimerExpiresAt: { [Op.lte]: now }
                    }
                }
            );
        } catch (expErr) {
            console.warn('Auto-expire check warning:', expErr.message);
        }

        let whereClause = {};
        if (tab === 'pending') {
            whereClause = {
                status: 'PENDING',
                hitlStatus: 'PENDING',
                hitlTimerExpiresAt: { [Op.gt]: now }
            };
        } else if (tab === 'audited') {
            whereClause = {
                hitlStatus: { [Op.in]: ['APPROVED', 'OVERRIDDEN'] }
            };
        } else if (tab === 'missed') {
            whereClause = {
                hitlStatus: 'TIMEOUT_FALLBACK'
            };
        }

        const queue = await PatientRequest.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'patientUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{
                        model: PatientProfile,
                        as: 'patientProfile',
                        attributes: ['fullName', 'dateOfBirth', 'sex', 'bloodGroup', 'medicalConditions', 'allergies', 'currentMedications', 'lifestyle']
                    }]
                }
            ],
            order: [
                ['createdAt', tab === 'pending' ? 'ASC' : 'DESC']
            ]
        });

        // Compute counts
        const pendingCount = await PatientRequest.count({
            where: { status: 'PENDING', hitlStatus: 'PENDING', hitlTimerExpiresAt: { [Op.gt]: now } }
        });
        const auditedCount = await PatientRequest.count({
            where: { hitlStatus: { [Op.in]: ['APPROVED', 'OVERRIDDEN'] } }
        });
        const missedCount = await PatientRequest.count({
            where: { hitlStatus: 'TIMEOUT_FALLBACK' }
        });

        return res.json({
            queue,
            counts: {
                pending: pendingCount,
                audited: auditedCount,
                missed: missedCount
            }
        });
    } catch (err) {
        console.error('List HITL queue error:', err);
        return res.status(500).json({ error: 'Failed to retrieve HITL triage queue.' });
    }
}

// ── POST /api/requests/hitl/:id/approve ───────────────────────────────────────
async function approveHitlTriage(req, res) {
    try {
        const { id } = req.params;
        const request = await PatientRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({ error: 'Triage request not found.' });
        }

        const reviewerProfile = await ReviewerProfile.findOne({ where: { userId: req.user.id } });
        const reviewerName = reviewerProfile?.fullName || req.user.email || 'Medical Reviewer';

        const updatedAnalysis = {
            ...(request.triageAnalysis || {}),
            validatedByHitl: true,
            reviewerName,
            reviewedAt: new Date().toISOString()
        };

        await request.update({
            hitlStatus: 'APPROVED',
            isHitlOverridden: false,
            hitlReviewerId: req.user.id,
            hitlReviewerName: reviewerName,
            hitlReviewedAt: new Date(),
            triageAnalysis: updatedAnalysis
        });

        return res.json({
            message: 'Triage validated and approved by medical reviewer.',
            request
        });
    } catch (err) {
        console.error('Approve HITL error:', err);
        return res.status(500).json({ error: 'Failed to approve triage.' });
    }
}

// ── POST /api/requests/hitl/:id/override ──────────────────────────────────────
async function overrideHitlTriage(req, res) {
    try {
        const { id } = req.params;
        const { correctedCategory, correctedSpecialist, overrideReason, additionalGuidance } = req.body;

        if (!correctedCategory || !overrideReason) {
            return res.status(400).json({ error: 'Corrected category and override reason are required.' });
        }

        const request = await PatientRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({ error: 'Triage request not found.' });
        }

        const reviewerProfile = await ReviewerProfile.findOne({ where: { userId: req.user.id } });
        const reviewerName = reviewerProfile?.fullName || req.user.email || 'Medical Reviewer';

        const updatedAnalysis = {
            ...(request.triageAnalysis || {}),
            triageCategory: correctedCategory,
            recommendedSpecialization: correctedSpecialist || request.triageAnalysis?.recommendedSpecialization || 'General Physician',
            clinicalReasoning: overrideReason,
            additionalGuidance: additionalGuidance || null,
            validatedByHitl: true,
            isOverridden: true,
            originalCategory: request.originalAiAnalysis?.triageCategory || request.triageCategory,
            reviewerName,
            reviewedAt: new Date().toISOString()
        };

        // 1. Store in TriageCorrection table for model improvement / RLHF training
        try {
            await TriageCorrection.create({
                requestId: request.id,
                patientId: request.patientId,
                reviewerId: req.user.id,
                reviewerName,
                symptoms: request.symptoms,
                duration: request.duration,
                painLevel: request.painLevel,
                affectedArea: request.affectedArea,
                attachments: request.attachments || [],
                originalAiCategory: request.originalAiAnalysis?.triageCategory || request.triageCategory,
                originalSpecialist: request.originalAiAnalysis?.recommendedSpecialization || 'General Physician',
                originalReasoning: request.originalAiAnalysis?.clinicalReasoning || request.triageReasoning,
                correctedCategory,
                correctedSpecialist: correctedSpecialist || request.triageAnalysis?.recommendedSpecialization,
                overrideReason,
                fullDatasetEntry: {
                    patientId: request.patientId,
                    symptoms: request.symptoms,
                    duration: request.duration,
                    painLevel: request.painLevel,
                    affectedArea: request.affectedArea,
                    originalAiOutput: request.originalAiAnalysis || request.triageAnalysis,
                    clinicianOverride: {
                        correctedCategory,
                        correctedSpecialist,
                        overrideReason,
                        reviewerId: req.user.id,
                        reviewerName,
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } catch (saveCorrErr) {
            console.warn('Could not record to triage_corrections table (non-fatal):', saveCorrErr.message);
        }

        // 2. Update PatientRequest
        await request.update({
            triageCategory: correctedCategory,
            triageReasoning: overrideReason,
            triageAnalysis: updatedAnalysis,
            hitlStatus: 'OVERRIDDEN',
            isHitlOverridden: true,
            hitlReviewerId: req.user.id,
            hitlReviewerName: reviewerName,
            hitlReviewedAt: new Date(),
            hitlOverrideNotes: overrideReason
        });

        return res.json({
            message: 'Triage override successfully saved and logged for model training.',
            request
        });
    } catch (err) {
        console.error('Override HITL error:', err);
        return res.status(500).json({ error: 'Failed to record triage override.' });
    }
}

// ── POST /api/requests/:id/hitl-timeout ───────────────────────────────────────
async function fallbackHitlTimeout(req, res) {
    try {
        const { id } = req.params;
        const request = await PatientRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found.' });
        }

        if (request.hitlStatus === 'PENDING') {
            await request.update({
                hitlStatus: 'TIMEOUT_FALLBACK',
                hitlOverrideNotes: '15-minute HITL window elapsed. Standard clinical triage routing activated.'
            });
        }

        return res.json({
            message: 'Timeout fallback processed. Teleconsultation option available.',
            request
        });
    } catch (err) {
        return res.status(500).json({ error: 'Timeout fallback failed.' });
    }
}

// ── GET /api/requests/nearby ──────────────────────────────────────────────────
async function listNearbyRequests(req, res) {
    try {
        const doctorProfile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
        if (!doctorProfile) {
            return res.status(404).json({ error: 'Doctor profile not found.' });
        }

        if (doctorProfile.verificationStatus !== 'VERIFIED') {
            return res.status(403).json({ error: 'Account pending credential verification.' });
        }

        const lat = parseFloat(req.query.lat) || (doctorProfile.latitude ? parseFloat(doctorProfile.latitude) : null);
        const lng = parseFloat(req.query.lng) || (doctorProfile.longitude ? parseFloat(doctorProfile.longitude) : null);
        const radiusKm = parseFloat(req.query.radiusKm) || 25;
        const category = req.query.category;
        const search = req.query.search || "";

        // Doctors only receive requests that have been reviewed by HITL or completed timeout fallback
        const whereClause = {
            status: 'PENDING',
            hitlStatus: { [Op.in]: ['APPROVED', 'OVERRIDDEN', 'TIMEOUT_FALLBACK'] }
        };

        if (category && category !== 'ALL') {
            whereClause.triageCategory = category;
        }

        if (search) {
            whereClause.symptoms = { [Op.iLike]: `%${search}%` };
        }

        const sequelize = require('../config/db');
        const attributes = [
            'id', 'patientId', 'doctorId', 'symptoms', 'location', 'requirement',
            'duration', 'painLevel', 'affectedArea', 'attachments', 'triageAnalysis',
            'hitlStatus', 'hitlReviewerName', 'hitlReviewedAt', 'isHitlOverridden', 'hitlOverrideNotes',
            'triageCategory', 'triageReasoning', 'status', 'createdAt',
            'latitude', 'longitude'
        ];

        let hasCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

        if (hasCoords) {
            const distanceFormula = `
              (6371 * acos(
                LEAST(1.0, GREATEST(-1.0, 
                  cos(radians(${lat})) * cos(radians("PatientRequest"."latitude")) * 
                  cos(radians("PatientRequest"."longitude") - radians(${lng})) + 
                  sin(radians(${lat})) * sin(radians("PatientRequest"."latitude"))
                ))
              ))
            `;
            attributes.push([sequelize.literal(distanceFormula), 'distanceKm']);
        }

        const list = await PatientRequest.findAll({
            where: whereClause,
            attributes,
            include: [
                {
                    model: User,
                    as: 'patientUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{
                        model: PatientProfile,
                        as: 'patientProfile',
                        attributes: ['fullName', 'dateOfBirth', 'sex', 'bloodGroup', 'medicalConditions', 'allergies']
                    }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        let requests = list.map(r => {
            const rObj = r.toJSON();
            if (r.get('distanceKm') !== undefined) {
                rObj.distanceKm = parseFloat(Number(r.get('distanceKm')).toFixed(1));
            }
            return rObj;
        });

        // Teleconsultations: Visible nationwide to all doctors!
        // Physical Visits / Emergencies: Filtered by nearby distance or doctor's city
        const targetCity = (req.query.city || doctorProfile.city || '').trim().toLowerCase();
        requests = requests.filter(reqItem => {
            if (reqItem.triageCategory === 'TELECONSULTATION') {
                return true; // Nationwide visibility for teleconsultation
            }

            // For Physical Visits / In-person: check distance radius or city match
            if (hasCoords && reqItem.distanceKm !== undefined) {
                return reqItem.distanceKm <= radiusKm;
            }

            if (targetCity) {
                const reqLoc = (reqItem.location || '').trim().toLowerCase();
                if (!reqLoc) return true;
                const cityMatch = reqLoc.includes(targetCity) || targetCity.includes(reqLoc);
                if (cityMatch) return true;
                const regions = (doctorProfile.regionsServed || []).map(r => r.trim().toLowerCase());
                return regions.some(r => reqLoc.includes(r) || r.includes(reqLoc));
            }

            return true;
        });

        return res.json({ requests });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error listing nearby requests.' });
    }
}

// ── PATCH /api/requests/:id/accept ────────────────────────────────────────────
async function acceptRequest(req, res) {
    try {
        const doctorProfile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
        if (!doctorProfile) {
            return res.status(404).json({ error: 'Doctor profile not found.' });
        }

        if (doctorProfile.verificationStatus !== 'VERIFIED') {
            return res.status(403).json({ error: 'Account pending credential verification.' });
        }

        const request = await PatientRequest.findByPk(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found.' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request has already been accepted or processed.' });
        }

        await request.update({
            doctorId: req.user.id,
            status: 'ACCEPTED',
        });

        const updatedRequest = await PatientRequest.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'patientUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'dateOfBirth', 'sex', 'bloodGroup'] }],
                },
            ],
        });

        return res.json({
            message: 'Request accepted successfully.',
            request: updatedRequest,
        });
    } catch (err) {
        return res.status(500).json({ error: 'Server error accepting request.' });
    }
}

// ── GET /api/requests/accepted ────────────────────────────────────────────────
async function listAcceptedRequests(req, res) {
    try {
        const list = await PatientRequest.findAll({
            where: { doctorId: req.user.id },
            include: [
                {
                    model: User,
                    as: 'patientUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'dateOfBirth', 'sex', 'bloodGroup', 'medicalConditions', 'allergies'] }],
                },
            ],
            order: [['updatedAt', 'DESC']],
        });

        return res.json({ requests: list });
    } catch (err) {
        return res.status(500).json({ error: 'Server error retrieving accepted requests.' });
    }
}

// ── GET /api/requests/:id ─────────────────────────────────────────────────────
async function getRequestDetail(req, res) {
    try {
        const { id } = req.params;
        const request = await PatientRequest.findOne({
            where: { id },
            include: [
                {
                    model: User,
                    as: 'patientUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'dateOfBirth', 'sex', 'bloodGroup', 'medicalConditions', 'allergies', 'currentMedications', 'lifestyle', 'emergencyContact'] }],
                },
                {
                    model: User,
                    as: 'doctorUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: ['fullName', 'specialization', 'clinicOrHospital'] }],
                }
            ]
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found.' });
        }

        const isPatient = req.user.id === request.patientId;
        const isDoctor = req.user.id === request.doctorId || req.user.role === 'doctor';
        const isAdmin = req.user.role === 'admin' || req.user.role === 'hitl_reviewer';

        if (!isPatient && !isDoctor && !isAdmin) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        return res.json({ request });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error retrieving request details.' });
    }
}

// ── PATCH /api/requests/:id/prescription ──────────────────────────────────────
async function issuePrescription(req, res) {
    try {
        const { id } = req.params;
        const { prescription } = req.body;

        const request = await PatientRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found.' });
        }

        if (request.doctorId !== req.user.id) {
            return res.status(403).json({ error: 'Only the attending doctor can issue a prescription.' });
        }

        if (request.status !== 'ACCEPTED') {
            return res.status(400).json({ error: 'Prescriptions can only be issued for accepted requests.' });
        }

        request.prescription = {
            ...prescription,
            issuedAt: new Date()
        };
        request.status = 'COMPLETED';
        await request.save();

        return res.json({
            message: 'Prescription issued successfully.',
            request
        });
    } catch (err) {
        return res.status(500).json({ error: 'Server error issuing prescription.' });
    }
}

module.exports = {
    uploadAttachmentMulter,
    uploadAttachment,
    previewTriage,
    listMyRequests,
    createRequest,
    listHitlQueue,
    approveHitlTriage,
    overrideHitlTriage,
    fallbackHitlTimeout,
    listNearbyRequests,
    acceptRequest,
    listAcceptedRequests,
    getRequestDetail,
    issuePrescription,
};
