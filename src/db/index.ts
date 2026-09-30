import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __pgPool?: Pool;
  __schemaReady?: Promise<void>;
};

/**
 * Tolerates the usual copy-paste slips when the Aiven URI is pasted into an env var:
 * a leading `psql `, surrounding quotes, stray whitespace/newlines.
 */
export function normalizeDatabaseUrl(raw = process.env.DATABASE_URL ?? "") {
  return raw
    .trim()
    .replace(/^psql\s+/i, "")
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
}

export function isDbConfigured() {
  const url = normalizeDatabaseUrl();
  if (!url || url.includes("<redacted>") || url.includes("PASSWORD@")) return false;
  try {
    const parsed = new URL(url);
    return /^postgres(ql)?:$/.test(parsed.protocol) && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

function createPool() {
  const url = new URL(normalizeDatabaseUrl());
  // Aiven uses a self-signed CA; sslmode=require in libpq terms means "encrypt, don't verify".
  return new Pool({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || "defaultdb",
    ssl: url.searchParams.get("sslmode") === "disable" ? undefined : { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPool() {
  if (!isDbConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!globalForDb.__pgPool) {
    globalForDb.__pgPool = createPool();
  }
  return globalForDb.__pgPool;
}

let _db: NodePgDatabase<typeof schema> | undefined;

export function db() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export { schema };
export type Database = ReturnType<typeof db>;
