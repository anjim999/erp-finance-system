import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.join(__dirname, "..", "..", ".env"),
});

export const PORT = process.env.GATEWAY_PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET;

// Backend service URLs
// Backend service URLs
export const ERP_BACKEND_URL = process.env.ERP_BACKEND_URL;
export const TEAMS_BACKEND_URL = process.env.TEAMS_BACKEND_URL;

// Upstash Redis (Caching)
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Database
export const DATABASE_URL = process.env.DATABASE_URL;

