import { neon } from "@neondatabase/serverless";

let cachedSql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error("NEON_DATABASE_URL is not set.");
  }
  if (!cachedSql) {
    cachedSql = neon(process.env.NEON_DATABASE_URL);
  }
  return cachedSql;
}
