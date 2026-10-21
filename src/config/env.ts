import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Validate environment variables once at startup so misconfiguration fails fast.
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
});

export const env = schema.parse(process.env);
