const { fn, col } = require('sequelize');
const { DoctorReview, DoctorProfile } = require('../models');

/**
 * POST /api/doctors/:doctorId/reviews
 * Body: { consultationId, rating (1-5), comment? }
 * Creates a doctor review for a completed consultation and recomputes the doctor's
 * average rating + review count directly on the DoctorProfile row.
 */
async function postReview(req, res) {
    const { doctorId } = req.params;
    const patientId = req.user.id;
    const { consultationId, rating, comment } = req.body;

    // ── Input validation ─────────────────────────────────────────────────────
    if (!consultationId) {
        return res.status(400).json({ error: 'consultationId is required' });
    }
    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    try {
        // Check doctor exists
        const doctor = await DoctorProfile.findOne({ where: { userId: doctorId } });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Guard: one review per consultation (unique constraint on consultationId)
        const existing = await DoctorReview.findOne({ where: { consultationId } });
        if (existing) {
            return res.status(409).json({ error: 'You have already reviewed this consultation' });
        }

        // Create the review
        const review = await DoctorReview.create({
            patientId,
            doctorId,
            consultationId,
            rating: parsedRating,
            comment: comment || null,
        });

        // ── Recompute doctor's aggregate rating ──────────────────────────────
        // Pulls AVG and COUNT directly from the reviews table so the doctor's
        // leaderboard score always reflects real data.
        const aggregate = await DoctorReview.findOne({
            where: { doctorId },
            attributes: [
                [fn('AVG', col('rating')), 'avgRating'],
                [fn('COUNT', col('id')), 'reviewCount'],
            ],
            raw: true,
        });

        const avgRating = parseFloat(aggregate.avgRating || 0).toFixed(2);
        const reviewCount = parseInt(aggregate.reviewCount, 10);

        // Update doctor profile — columns are auto-added by Sequelize if they don't exist
        // (development: sync({ alter: true }) in server startup; production: add migration)
        await doctor.update({ avgRating, reviewCount });

        return res.status(201).json({
            message: 'Review submitted successfully',
            review,
            doctorStats: { avgRating: Number(avgRating), reviewCount },
        });
    } catch (err) {
        // Unique constraint violation — already reviewed
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'You have already reviewed this consultation' });
        }
        console.error('[postReview] error:', err);
        return res.status(500).json({ error: 'Failed to submit review' });
    }
}

module.exports = { postReview };
