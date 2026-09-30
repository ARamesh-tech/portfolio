#!/usr/bin/env node
/**
 * Quick connectivity check for DATABASE_URL.
 *
 *   npm run db:check                 # reads .env.local / .env
 *   DATABASE_URL=postgres://... npm run db:check
 *
 * Prints the server version and row counts for the app tables (if they exist).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

function loadEnvFile(file) {
  try {
    for (const line of readFileSync(resolve(process.cwd(), file), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m || process.env[m[1]] !== undefined) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  } catch {}
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const raw = process.env.DATABASE_URL ?? "";
if (!raw || raw.includes("<redacted>") || raw.includes("PASSWORD@")) {
  console.error("✗ DATABASE_URL is missing or still contains a placeholder. Set the real Aiven Service URI in .env.local.");
  process.exit(1);
}

const url = new URL(raw);
console.log(`→ Connecting to ${url.hostname}:${url.port || 5432}/${url.pathname.slice(1)} as ${decodeURIComponent(url.username)} …`);

const pool = new pg.Pool({
  host: url.hostname,
  port: Number(url.port || 5432),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, "") || "defaultdb",
  ssl: url.searchParams.get("sslmode") === "disable" ? undefined : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  max: 1,
});

try {
  const started = Date.now();
  const { rows } = await pool.query("select version() as version, current_database() as db, now() as now");
  console.log(`✓ Connected in ${Date.now() - started} ms`);
  console.log(`  ${rows[0].version.split(",")[0]} · database ${rows[0].db} · server time ${rows[0].now.toISOString()}`);

  const tables = ["user", "post", "comment", "reaction", "contact_message", "subscriber"];
  const existing = await pool.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)`, [tables]);
  const names = new Set(existing.rows.map((r) => r.table_name));
  if (names.size === 0) {
    console.log("  No app tables yet — they are created automatically the first time the app touches the database.");
  } else {
    for (const t of tables) {
      if (!names.has(t)) continue;
      const { rows: c } = await pool.query(`select count(*)::int as n from "${t}"`);
      console.log(`  ${t.padEnd(16)} ${String(c[0].n).padStart(6)} rows`);
    }
  }
  process.exit(0);
} catch (err) {
  const msg = err?.message ?? String(err);
  console.error(`✗ Connection failed: ${msg}`);
  if (/password authentication failed/i.test(msg)) console.error("  → The password in DATABASE_URL is wrong. Copy the Service URI from the Aiven console (it contains the real avnadmin password).");
  else if (err?.code === "ENOTFOUND") console.error("  → Hostname not found. Check the host part of DATABASE_URL.");
  else if (err?.code === "ETIMEDOUT" || /timeout/i.test(msg)) console.error("  → Timed out. Is the Aiven service powered on? Does its IP allow-list include this machine / Vercel (0.0.0.0/0)?");
  process.exit(1);
} finally {
  await pool.end().catch(() => {});
}
