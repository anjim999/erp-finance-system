import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

export const PORT =process.env.ERP_PORT||5001;
export const JWT_SECRET = process.env.JWT_SECRET;
export const EMAIL_FROM = process.env.EMAIL_FROM;
export const BREVO_API_KEY = process.env.BREVO_API_KEY;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Gateway communication
export const GATEWAY_URL = process.env.GATEWAY_URL;
export const GATEWAY_INTERNAL_SECRET = process.env.GATEWAY_INTERNAL_SECRET;
