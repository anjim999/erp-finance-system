import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.join(__dirname, "..", "..", ".env"),
});

export const PORT = process.env.PORT || process.env.TEAMS_PORT;
export const JWT_SECRET = process.env.JWT_SECRET;

// Database
export const DATABASE_URL = process.env.DATABASE_URL;
