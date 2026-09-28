import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { allowed } from "@/lib/auth";
import { asTicket, ensureDatabase, pool } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  if (!allowed(request)) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try { await ensureDatabase(); const result = await pool.query("SELECT * FROM maintenance_requests ORDER BY created_at DESC"); return NextResponse.json({ tickets: result.rows.map(asTicket) }); }
  catch (error) { console.error("Maintenance read failed", error); return NextResponse.json({ error: "Maintenance records are temporarily unavailable." }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  const session = allowed(request);
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const value = await request.json() as Record<string, unknown>;
    const equipmentId = String(value.equipmentId ?? ""), issue = String(value.issue ?? "").trim(), location = String(value.location ?? "").trim();
    const reporter = String(value.reporter ?? session.name).trim(), priority = String(value.priority ?? "Medium");
    if (issue.length < 12 || !location || !reporter || !["Critical","High","Medium","Low"].includes(priority)) return NextResponse.json({ error: "Check the request details and try again." }, { status: 400 });
    await ensureDatabase();
    const found = await pool.query("SELECT id,name FROM equipment WHERE id=$1", [equipmentId]);
    if (!found.rowCount) return NextResponse.json({ error: "Select a valid equipment item." }, { status: 400 });
    const id = `MT-${Date.now().toString().slice(-6)}${randomBytes(1).toString("hex")}`;
    const created = new Date().toLocaleString("en", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
    const result = await pool.query("INSERT INTO maintenance_requests (id,equipment_id,equipment,issue,location,reporter,priority,status,created) VALUES ($1,$2,$3,$4,$5,$6,$7,'Open',$8) RETURNING *", [id,equipmentId,found.rows[0].name,issue,location,reporter,priority,created]);
    return NextResponse.json({ ticket: asTicket(result.rows[0]) }, { status: 201 });
  } catch (error) { console.error("Maintenance create failed", error); return NextResponse.json({ error: "The request could not be saved." }, { status: 500 }); }
}
