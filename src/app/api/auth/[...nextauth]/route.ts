import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { isDbConfigured } from "@/db";
import { ensureSchema } from "@/db/bootstrap";

async function prepare() {
  if (isDbConfigured()) {
    await ensureSchema().catch(() => {});
  }
}

export async function GET(req: NextRequest) {
  await prepare();
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  await prepare();
  return handlers.POST(req);
}
