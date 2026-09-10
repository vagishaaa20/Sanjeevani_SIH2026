require('./config/env');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const CORS_ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) || CORS_ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked for origin: ${origin}`));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Sanjeevani API is running' }));

// ── Master Router ─────────────────────────────────────────────────────────────
app.use('/api', routes);
app.use('/api/documents', require('./routes/documentRoutes'));
// ── Fallback + error handler ──────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

module.exports = app;