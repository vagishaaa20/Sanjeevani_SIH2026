/**
 * In-memory sliding-window rate limiter for POST /api/whatsapp/send
 *
 * Limits: 5 outbound sends per patient per hour.
 * Uses in-memory storage (Map) — resets on server restart.
 * For multi-instance deployments upgrade this to a Redis INCR/EXPIRE approach.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SENDS = 5;

// Map<patientId, { count: number, windowStart: number }>
const windows = new Map();

/**
 * Express middleware. Applies rate limit keyed by req.user.id.
 * Returns 429 if the patient has exceeded MAX_SENDS within the rolling window.
 */
function whatsappRateLimit(req, res, next) {
    const patientId = req.user?.id;
    if (!patientId) return res.status(401).json({ error: 'Authentication required' });

    const now = Date.now();
    const entry = windows.get(patientId) || { count: 0, windowStart: now };

    // Reset window if it has rolled over
    if (now - entry.windowStart > WINDOW_MS) {
        entry.count = 0;
        entry.windowStart = now;
    }

    entry.count += 1;
    windows.set(patientId, entry);

    if (entry.count > MAX_SENDS) {
        const retryAfterSec = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
        res.set('Retry-After', retryAfterSec);
        return res.status(429).json({
            error: `Too many WhatsApp sends. Limit is ${MAX_SENDS} per hour. Retry after ${retryAfterSec}s.`,
        });
    }

    return next();
}

module.exports = whatsappRateLimit;
