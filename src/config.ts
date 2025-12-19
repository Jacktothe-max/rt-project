import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_ISSUER: z.string().min(1).default("rt-marketplace"),
  PORT: z.coerce.number().int().positive().default(3001)
});

export const env = envSchema.parse(process.env);


