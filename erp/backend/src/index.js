// src/index.js - Main Server Entry Point with Socket.io
import http from 'http';
import app from './app.js';
import { PORT } from './config/env.js';
import { runMigrations } from './db/migrations.js';
import { initializeSocket } from './utils/socketService.js';

const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Run database migrations on startup
// Run database migrations on startup
import pool from './db/pool.js'; // Import pool to close it
runMigrations().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket ready for connections`);
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = () => {
  console.log('\n[ERP] Received kill signal, shutting down gracefully...');
  server.close(async () => {
    console.log('[ERP] HTTP server closed.');

    // Close Database Pool
    try {
      await pool.end();
      console.log('[ERP] Database pool closed.');
    } catch (err) {
      console.error('[ERP] Error closing database pool:', err);
    }

    console.log('[ERP] Closed out remaining connections.');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('[ERP] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
