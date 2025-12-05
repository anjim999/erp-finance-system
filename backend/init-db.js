import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDatabase() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf-8');
    
    console.log('Initializing database schema...');
    await pool.query(schemaSql);
    console.log('✓ Database schema initialized successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Error initializing database:', err.message);
    process.exit(1);
  }
}

initDatabase();
