const { fn, col, literal } = require('sequelize');
const { SubsidyApplication, Consultation } = require('../models');
const { INCOME_BRACKET, SUBSIDY_STATUS, UNDERSERVED_PINCODES } = require('../models/subsidyApplicationModel');

/**
 * Compute the subsidy percentage for a given income bracket and pincode.
 * Rules (simulated government scheme):
 *   - below_1lpa  → 50%
 *   - 1_3lpa      → 30%
 *   - 3_5lpa      → 15%
 *   - above_5lpa  → 0%  (add 10% bonus if underserved area)
 *   - underserved area adds +10% on top, capped at 60%
 */
function computeSubsidyPercent(incomeBracket, pincode) {
    const isUnderserved = UNDERSERVED_PINCODES.includes(String(pincode).trim());

    const base = {
        [INCOME_BRACKET.BELOW_1LPA]: 50,
        [INCOME_BRACKET.ONE_TO_3LPA]: 30,
        [INCOME_BRACKET.THREE_TO_5LPA]: 15,
        [INCOME_BRACKET.ABOVE_5LPA]: 0,
    }[incomeBracket] ?? 0;

    const bonus = isUnderserved ? 10 : 0;
    return Math.min(60, base + bonus);
}

/**
 * GET /api/subsidy/me
 * Returns the patient's subsidy status and total amount saved across consultations.
 */
async function getMySubsidy(req, res) {
    const patientId = req.user.id;

    try {
        const application = await SubsidyApplication.findOne({ where: { patientId } });

        // Compute total saved from subsidised consultations
        const savingsResult = await Consultation.findOne({
            where: { patientId, subsidyApplied: true },
            attributes: [[fn('SUM', col('subsidyAmount')), 'totalSaved']],
            raw: true,
        });
        const totalSaved = parseFloat(savingsResult?.totalSaved || 0);

        if (!application) {
            return res.json({
                enrolled: false,
                status: null,
                subsidyPercent: 0,
                totalSaved,
                application: null,
            });
        }

        return res.json({
            enrolled: application.status === SUBSIDY_STATUS.APPROVED,
            status: application.status,
            subsidyPercent: application.status === SUBSIDY_STATUS.APPROVED
                ? Number(application.subsidyPercent)
                : 0,
            totalSaved,
            application: {
                id: application.id,
                incomeBracket: application.incomeBracket,
                pincode: application.pincode,
                idProofUrl: application.idProofUrl,
                createdAt: application.createdAt,
                reviewedAt: application.reviewedAt,
            },
        });
    } catch (err) {
        console.error('[getMySubsidy] error:', err);
        return res.status(500).json({ error: 'Failed to fetch subsidy info' });
    }
}

/**
 * POST /api/subsidy/apply
 * Body: { incomeBracket, pincode, idProofUrl? }
 * Creates (or replaces) a SubsidyApplication for the patient.
 * Eligibility is computed and status is set to 'approved' automatically (simulated).
 */
async function applySubsidy(req, res) {
    const patientId = req.user.id;
    const { incomeBracket, pincode, idProofUrl } = req.body;

    if (!incomeBracket || !Object.values(INCOME_BRACKET).includes(incomeBracket)) {
        return res.status(400).json({
            error: `incomeBracket must be one of: ${Object.values(INCOME_BRACKET).join(', ')}`,
        });
    }
    if (!pincode) {
        return res.status(400).json({ error: 'pincode is required' });
    }

    try {
        // One application per patient — update if already exists
        const existing = await SubsidyApplication.findOne({ where: { patientId } });
        if (existing && existing.status === SUBSIDY_STATUS.APPROVED) {
            return res.status(409).json({
                error: 'You already have an approved subsidy application',
                application: existing,
            });
        }

        const subsidyPercent = computeSubsidyPercent(incomeBracket, pincode);
        const isEligible = subsidyPercent > 0;

        const data = {
            patientId,
            incomeBracket,
            pincode: String(pincode).trim(),
            idProofUrl: idProofUrl || null,
            status: isEligible ? SUBSIDY_STATUS.APPROVED : SUBSIDY_STATUS.REJECTED,
            subsidyPercent,
            reviewedAt: new Date(),
        };

        let application;
        if (existing) {
            await existing.update(data);
            application = existing;
        } else {
            application = await SubsidyApplication.create(data);
        }

        return res.status(201).json({
            message: isEligible
                ? `You are eligible for ${subsidyPercent}% subsidy on consultations.`
                : 'Based on your details, you do not qualify for the current subsidy scheme.',
            enrolled: isEligible,
            subsidyPercent,
            application,
        });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'A subsidy application already exists for your account' });
        }
        console.error('[applySubsidy] error:', err);
        return res.status(500).json({ error: 'Failed to submit subsidy application' });
    }
}

module.exports = { getMySubsidy, applySubsidy };
