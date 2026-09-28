import { NextResponse } from "next/server";
import { ensureDatabase, pool } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  try { await ensureDatabase(); await pool.query("SELECT 1"); return NextResponse.json({ ok: true, database: "connected" }); }
  catch (error) { console.error("Health check failed", error); return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 }); }
}
