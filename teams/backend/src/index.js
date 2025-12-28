// Teams Backend - Main Server Entry Point with Socket.io
import http from 'http';
import app from './app.js';
import { PORT } from './config/env.js';
import { initializeSocket } from './utils/socketService.js';

const server = http.createServer(app);

// Initialize Socket.io for Teams
// Initialize Socket.io for Teams
import pool from './db/pool.js'; // Import pool to close it
initializeSocket(server);

server.listen(PORT, () => {
    console.log(`🚀 Teams Backend running on port ${PORT}`);
    console.log(`📡 WebSocket ready for chat connections`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = () => {
    console.log('\n[TEAMS] Received kill signal, shutting down gracefully...');
    server.close(async () => {
        console.log('[TEAMS] HTTP server closed.');

        // Close Database Pool
        try {
            await pool.end();
            console.log('[TEAMS] Database pool closed.');
        } catch (err) {
            console.error('[TEAMS] Error closing database pool:', err);
        }

        console.log('[TEAMS] Closed out remaining connections.');
        process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
        console.error('[TEAMS] Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
