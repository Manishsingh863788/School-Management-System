import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or server dir
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to local server .env

const envSchema = z.object({
  PORT: z.string().default('5000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/edumanage?schema=public'),
  JWT_SECRET: z.string().default('edumanage_jwt_super_secret_production_key_2026_algions'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SCHOOL_NAME: z.string().default('EduManage International Academy'),
  SCHOOL_ADDRESS: z.string().default('100 Academic Boulevard, Silicon Valley, CA 94025'),
  SCHOOL_PHONE: z.string().default('+1 (555) 019-2834'),
  SCHOOL_EMAIL: z.string().default('admin@edumanage.academy'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
