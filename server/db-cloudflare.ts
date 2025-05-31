import { drizzle } from 'drizzle-orm/d1';
import * as schema from "../shared/schema";

export function createDB(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

// Type for Cloudflare environment
export interface CloudflareEnv {
  DB: D1Database;
  SESSIONS: KVNamespace;
  NODE_ENV: string;
  SESSION_SECRET: string;
}