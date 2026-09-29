import { NextRequest, NextResponse } from "next/server";
import { allowed } from "@/lib/auth";
import { ensureDatabase, pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!allowed(request)) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await ensureDatabase();
    await pool.query("CREATE TABLE IF NOT EXISTS prototype_state (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    const result = await pool.query("SELECT value FROM prototype_state WHERE key='campusops'");
    return NextResponse.json(result.rows[0]?.value ?? null);
  } catch (error) {
    console.error("Prototype state read failed", error);
    return NextResponse.json({ error: "Application data is temporarily unavailable." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = allowed(request);
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const value = await request.json();
    if (!value || !Array.isArray(value.tickets) || !Array.isArray(value.equipment) || !Array.isArray(value.zones) || !Array.isArray(value.acknowledgedAlerts)) {
      return NextResponse.json({ error: "Invalid application data." }, { status: 400 });
    }
    await ensureDatabase();
    await pool.query("CREATE TABLE IF NOT EXISTS prototype_state (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    if (session.role !== "admin") {
      const current = await pool.query("SELECT value FROM prototype_state WHERE key='campusops'");
      const saved = current.rows[0]?.value;
      if (saved && (JSON.stringify(value.equipment) !== JSON.stringify(saved.equipment) || JSON.stringify(value.zones) !== JSON.stringify(saved.zones) || JSON.stringify(value.acknowledgedAlerts) !== JSON.stringify(saved.acknowledgedAlerts))) {
        return NextResponse.json({ error: "Administrator access is required to change equipment or building controls." }, { status: 403 });
      }
    }
    await pool.query("INSERT INTO prototype_state (key,value) VALUES ('campusops',$1::jsonb) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()", [JSON.stringify(value)]);
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Prototype state save failed", error);
    return NextResponse.json({ error: "Application data could not be saved." }, { status: 500 });
  }
}
