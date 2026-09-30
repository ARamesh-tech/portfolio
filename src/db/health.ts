import { getPool, isDbConfigured, normalizeDatabaseUrl } from "./index";

export type DbHealth = { configured: boolean; ok: boolean; error?: string; latencyMs?: number };

let cached: { at: number; value: DbHealth } | null = null;
const TTL_MS = 30_000;

function describeUnconfigured() {
  const url = normalizeDatabaseUrl();
  if (!url) return "DATABASE_URL is not set.";
  if (url.includes("<redacted>") || url.includes("PASSWORD@")) return "DATABASE_URL still contains a placeholder password — paste the real Service URI from the Aiven console.";
  return "DATABASE_URL is not a valid postgres:// URL — it should look like postgres://avnadmin:PASSWORD@host.aivencloud.com:PORT/defaultdb?sslmode=require";
}

/** Cheap `SELECT 1` probe, cached for 30s. Used for status UI — never for gating queries. */
export async function getDbHealth(force = false): Promise<DbHealth> {
  if (!isDbConfigured()) return { configured: false, ok: false, error: describeUnconfigured() };
  if (!force && cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const started = Date.now();
  let value: DbHealth;
  try {
    await getPool().query("select 1");
    value = { configured: true, ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    value = { configured: true, ok: false, error: describeDbError(err) };
  }
  cached = { at: Date.now(), value };
  return value;
}

export function describeDbError(err: unknown): string {
  const e = err as { code?: string; message?: string } | undefined;
  const msg = e?.message ?? String(err);
  if (/password authentication failed/i.test(msg)) return "Password authentication failed — check the password in DATABASE_URL (Aiven → service → Connection information).";
  if (e?.code === "ENOTFOUND" || /getaddrinfo/i.test(msg)) return "Host not found — check the hostname in DATABASE_URL.";
  if (e?.code === "ECONNREFUSED") return "Connection refused — check the port and that the Aiven service is running (not powered off).";
  if (e?.code === "ETIMEDOUT" || /timeout/i.test(msg)) return "Connection timed out — the Aiven service may be powered off or its IP allow-list blocks this network.";
  if (/self[- ]signed|certificate/i.test(msg)) return "TLS certificate problem — keep sslmode=require in DATABASE_URL.";
  return msg.length > 200 ? `${msg.slice(0, 200)}…` : msg;
}
