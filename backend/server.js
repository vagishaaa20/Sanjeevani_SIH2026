const http = require('http');
const env = require('./src/config/env');
const app = require('./src/app');
const sequelize = require('./src/config/db');
require('./src/models');

// If you have a separate socket initialization module, import it here:
// const { initSocket } = require('./src/socket'); 
const { startOutbreakCronWorker } = require('./src/workers/outbreakCronWorker');
const { verifyAccessToken } = require('./src/utils/jwt');
const { PatientProfile } = require('./src/models');
const ngeohash = require('ngeohash');

async function startServer() {
  try {
    await sequelize.authenticateDatabase();
    await sequelize.sync();

    // 1. Create HTTP server from Express app
    const server = http.createServer(app);

    // 2. Initialize Socket.io (if attached here or in an external helper)
    // If you manage Socket.io directly here:
    const { Server } = require('socket.io');
    const ALLOWED_ORIGINS = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
    const io = new Server(server, {
      cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        // Do NOT set credentials: true with a wildcard origin

      }
    });


    io.on('connection', async (socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`);

      const token = socket.handshake.auth?.token;
      if (token) {
        try {
          const user = verifyAccessToken(token);
          socket.user = user;

          socket.join(`user:${user.id}`);

          if (user.role === 'admin') {
            socket.join('admins');
          } else if (user.role === 'doctor') {
            socket.join('doctors');
          } else if (user.role === 'patient') {
            // Get patient geohash to join region room
            const profile = await PatientProfile.findByPk(user.id);
            if (profile && profile.latitude && profile.longitude) {
              const gh = ngeohash.encode(profile.latitude, profile.longitude, 5);
              socket.join(`region:${gh}`);
            }
          }
          console.log(`[Socket.io] User ${user.id} (${user.role}) authenticated & joined rooms.`);
        } catch (err) {
          console.error(`[Socket.io] Invalid token for ${socket.id}`);
        }
      }

      socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      });
    });

    // Start background services
    startOutbreakCronWorker(io);

    // Make io accessible across routes/controllers via app if needed
    app.set('io', io);

    // 3. Listen on the HTTP server instance, NOT app.listen()
    const PORT = env.port || 5000;
    server.listen(PORT, () => {
      console.log(`Sanjeevani API listening at http://localhost:${PORT}`);
    });

    return server;
  } catch (error) {
    const details = error.message || (error.original && error.original.message) || String(error);
    console.error('Backend startup failed:', details);
    process.exitCode = 1;
  }
}

startServer();

module.exports = startServer;