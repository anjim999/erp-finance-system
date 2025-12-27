import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const isNeonOrSupabase = process.env.DATABASE_URL?.includes('neon') || process.env.DATABASE_URL?.includes('supabase');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings - optimized for Neon serverless
  max: isNeonOrSupabase ? 10 : 50, // Neon free tier has connection limits
  min: isNeonOrSupabase ? 0 : 2, // Don't hold minimum connections for serverless (they timeout)
  idleTimeoutMillis: isNeonOrSupabase ? 10000 : 30000, // Release idle connections faster for serverless
  connectionTimeoutMillis: 20000, // Wait up to 20s for available connection
  // Keepalive settings - critical for Neon serverless
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000, // Start keepalive pings after 10s idle
  // For Neon/Supabase serverless SSL
  ssl: isNeonOrSupabase ? { rejectUnauthorized: false } : false,
});

// Connection monitoring (helps diagnose production issues)
let connectionCount = 0;

// Test connection on startup
pool.on('connect', (client) => {
  connectionCount++;
  console.log(`✅ Database connected (Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount})`);
});

// Uncomment below to see every connection acquisition (verbose!)
// pool.on('acquire', () => {
//   console.log(`🔄 Connection acquired (Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount})`);
// });



pool.on('remove', () => {
  connectionCount--;
  console.log(`⚠️ Connection removed (Total: ${pool.totalCount}, Idle: ${pool.idleCount})`);
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected database error:', err.message);
  console.error('Pool status:', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

// Proactive connection health check - critical for Neon serverless
// This keeps connections alive and detects issues before user requests
setInterval(async () => {
  try {
    // Simple query to keep connection alive
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
  }
  
  if (pool.waitingCount > 0) {
    console.warn(`⚠️ ${pool.waitingCount} clients waiting for connection!`);
    console.warn(`Pool: Total=${pool.totalCount}, Idle=${pool.idleCount}, Waiting=${pool.waitingCount}`);
  }
}, 60000); // Check every 60 seconds

// Enhanced query function with auto-retry and timeout
export async function query(text, params, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      if (i === retries) throw error;
      if (error.message.includes('Connection terminated') || error.message.includes('timeout')) {
        console.warn(`Query failed (attempt ${i + 1}/${retries + 1}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
}

export default pool;

