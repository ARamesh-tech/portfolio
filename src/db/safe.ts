import { isDbConfigured } from "./index";
import { ensureSchema } from "./bootstrap";

/**
 * Run a database query but degrade gracefully (return a fallback) when the
 * database is unreachable or not configured yet. Used by public pages so the
 * portfolio itself always renders.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDbConfigured()) return fallback;
  try {
    await ensureSchema();
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[db] query failed:", err instanceof Error ? err.message : err);
    }
    return fallback;
  }
}

/** Like safeQuery but throws — for mutations where the caller shows an error. */
export async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  if (!isDbConfigured()) {
    throw new Error("The database is not configured yet. Please try again later.");
  }
  await ensureSchema();
  return fn();
}
