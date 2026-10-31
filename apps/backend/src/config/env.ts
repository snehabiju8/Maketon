import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

// Neon requires SSL, so both connection strings must be PostgreSQL URLs with sslmode set.
const neonUrl = (name: string) =>
  z
    .string({ required_error: `${name} is required` })
    .min(1, `${name} is required`)
    .refine((val) => /^postgres(ql)?:\/\//.test(val), {
      message: `${name} must be a postgresql:// connection string`,
    })
    .refine((val) => /[?&]sslmode=(require|verify-ca|verify-full)\b/.test(val), {
      message: `${name} must include sslmode=require`,
    });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  // Neon pooled connection (hostname contains -pooler), used by the running application
  DATABASE_URL: neonUrl("DATABASE_URL"),
  // Neon direct connection, used by Prisma CLI for migrations
  DIRECT_URL: neonUrl("DIRECT_URL"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  COOKIE_SECURE: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(9).optional(),
  ADMIN_NAME: z.string().optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Report only variable names and messages, never the values (they may contain credentials)
    const issues = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`);
    console.error(`❌ Invalid environment variables:\n${issues.join("\n")}`);
    throw new Error("Invalid environment configuration. Check your .env file.");
  }
  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
