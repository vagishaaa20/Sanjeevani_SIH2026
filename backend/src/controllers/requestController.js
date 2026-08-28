const { PatientRequest, User, DoctorProfile, PatientProfile } = require('../models');
const { Op } = require('sequelize');

/**
 * Automate triage logic using Gemini 1.5 Flash via REST endpoint.
 * Fallbacks to a keyword parser if GEMINI_API_KEY is not defined.
 */
async function performTriage(symptoms, requirement) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (GEMINI_API_KEY) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `You are an AI medical triage assistant. Analyze the patient's symptoms and requirements.
Categorize the severity and required action into exactly one of these labels:
- TELECONSULTATION (mild symptoms, follow-ups, simple advice, rashes, cold)
- PHYSICAL_VISIT (non-life-threatening but requires physical exam like basic wounds, fractures, chronic pain checkups)
- EMERGENCY_ESCALATION (life-threatening symptoms like chest pain, severe breathing difficulty, sudden numbness, heavy bleeding, unconsciousness)

Return EXACTLY a JSON string with the following schema, and NO markdown blocks or formatting:
{
  "category": "TELECONSULTATION" | "PHYSICAL_VISIT" | "EMERGENCY_ESCALATION",
  "reasoning": "A concise explanation of why this was chosen."
}`,
                                    },
                                    {
                                        text: `Symptoms: ${symptoms}\nRequirement: ${requirement}`,
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                    const startJson = cleanText.indexOf('{');
                    const endJson = cleanText.lastIndexOf('}');
                    const jsonStr = (startJson !== -1 && endJson !== -1 && endJson > startJson)
                        ? cleanText.slice(startJson, endJson + 1)
                        : cleanText;

                    const result = JSON.parse(jsonStr);
                    if (['TELECONSULTATION', 'PHYSICAL_VISIT', 'EMERGENCY_ESCALATION'].includes(result.category)) {
                        return {
                            category: result.category,
                            reasoning: result.reasoning,
                        };
                    }
                }
            }
        } catch (err) {
            console.error('LLM Triage failed, falling back to rule-based parser:', err.message);
        }
    }

    // FALLBACK PARSER (rule-based keyword matching)
    const symLower = (symptoms || '').toLowerCase();
    const reqLower = (requirement || '').toLowerCase();
    const merged = `${symLower} ${reqLower}`;

    const emergencyKeywords = [
        'chest pain',
        'breathing difficulty',
        'difficulty breathing',
        'unconscious',
        'severe bleeding',
        'heavy bleeding',
        'heart attack',
        'stroke',
        'paralysis',
        'fracture skull',
    ];
    const consultationKeywords = [
        'cough',
        'fever',
        'headache',
        'cold',
        'flu',
        'mild',
        'skin',
        'rash',
        'acne',
        'prescription',
        'consult',
        'allergy',
    ];

    if (emergencyKeywords.some((kw) => merged.includes(kw))) {
        return {
            category: 'EMERGENCY_ESCALATION',
            reasoning: 'Critical symptoms detected. Urgent assistance is required.',
        };
    }

    if (consultationKeywords.some((kw) => merged.includes(kw))) {
        return {
            category: 'TELECONSULTATION',
            reasoning: 'Symptoms appear mild and suited for online consulting.',
        };
    }

    return {
        category: 'PHYSICAL_VISIT',
        reasoning: 'In-person physical evaluation is recommended for this condition.',
    };
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
                    include: [{ model: DoctorProfile, as: 'doctorProfile', attributes: ['fullName', 'specialization'] }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        return res.json({ requests: list });
    } catch (err) {
        return res.status(500).json({ error: 'Server error retrieving requests.' });
    }
}

// ── POST /api/requests ────────────────────────────────────────────────────────
async function createRequest(req, res) {
    const { symptoms, location, requirement, latitude, longitude } = req.body;

    if (!symptoms || !location || !requirement) {
        return res.status(400).json({ error: 'Symptoms, Location, and Requirement are required fields.' });
    }

    try {
        const triage = await performTriage(symptoms, requirement);

        const request = await PatientRequest.create({
            patientId: req.user.id,
            symptoms,
            location,
            requirement,
            triageCategory: triage.category,
            triageReasoning: triage.reasoning,
            status: 'PENDING',
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
        });

        return res.status(201).json({
            message: 'Request created and triaged successfully.',
            request,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error creating clinical request.' });
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

        const whereClause = {
            status: 'PENDING',
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
            'triageCategory', 'triageReasoning', 'status', 'createdAt',
            'latitude', 'longitude'
        ];

        let order = [['createdAt', 'ASC']];
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
            whereClause[Op.and] = sequelize.where(sequelize.literal(distanceFormula), '<=', radiusKm);
            order = [
                ['triageCategory', 'ASC'],
                [sequelize.literal('distanceKm'), 'ASC']
            ];
        }

        const list = await PatientRequest.findAll({
            where: whereClause,
            attributes,
            include: [
                {
                    model: User,
                    as: 'patientUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'dateOfBirth', 'sex'] }],
                },
            ],
            order,
        });

        let requests = list.map(r => {
            const rObj = r.toJSON();
            if (r.get('distanceKm') !== undefined) {
                rObj.distanceKm = parseFloat(Number(r.get('distanceKm')).toFixed(1));
            }
            return rObj;
        });

        if (!hasCoords) {
            const targetCity = (req.query.city || doctorProfile.city || '').trim().toLowerCase();
            if (targetCity) {
                requests = requests.filter(reqItem => {
                    const reqLoc = (reqItem.location || '').trim().toLowerCase();
                    if (!reqLoc) return false;

                    const cityMatch = reqLoc.includes(targetCity) || targetCity.includes(reqLoc);
                    if (cityMatch) return true;

                    const regions = (doctorProfile.regionsServed || []).map(r => r.trim().toLowerCase());
                    return regions.some(r => reqLoc.includes(r) || r.includes(reqLoc));
                });
            }
        }

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

        // Re-fetch populated request details
        const updatedRequest = await PatientRequest.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'patientUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'dateOfBirth', 'sex'] }],
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

async function listAcceptedRequests(req, res) {
    try {
        const list = await PatientRequest.findAll({
            where: { doctorId: req.user.id, status: 'ACCEPTED' },
            include: [
                {
                    model: User,
                    as: 'patientUser',
                    attributes: ['id', 'email', 'phone'],
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'dateOfBirth', 'sex'] }],
                },
            ],
            order: [['updatedAt', 'DESC']],
        });

        return res.json({ requests: list });
    } catch (err) {
        return res.status(500).json({ error: 'Server error retrieving accepted requests.' });
    }
}

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
                    include: [{ model: PatientProfile, as: 'patientProfile', attributes: ['fullName', 'dateOfBirth', 'sex'] }],
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

        // Check authorization: patient who created it, assigned doctor, or admin
        const isPatient = req.user.id === request.patientId;
        const isDoctor = req.user.id === request.doctorId;
        const isAdmin = req.user.role === 'admin';

        if (!isPatient && !isDoctor && !isAdmin) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        return res.json({ request });
    } catch (err) {
        return res.status(500).json({ error: 'Server error retrieving request details.' });
    }
}

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
    listMyRequests,
    createRequest,
    listNearbyRequests,
    acceptRequest,
    listAcceptedRequests,
    getRequestDetail,
    issuePrescription,
};
