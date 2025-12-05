import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export function query(text, params) {
  return pool.query(text, params);
}

export default pool;
