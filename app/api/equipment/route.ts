import { NextRequest, NextResponse } from "next/server";
import { allowed } from "@/lib/auth";
import { asEquipment, ensureDatabase, pool } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  if (!allowed(request)) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try { await ensureDatabase(); const result = await pool.query("SELECT * FROM equipment ORDER BY id"); return NextResponse.json({ equipment: result.rows.map(asEquipment) }); }
  catch (error) { console.error("Equipment read failed", error); return NextResponse.json({ error: "Equipment is temporarily unavailable." }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  if (!allowed(request, "admin")) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    const value = await request.json() as Record<string, unknown>;
    const id = String(value.id ?? "").trim(), name = String(value.name ?? "").trim(), mm = String(value.mm ?? "").trim();
    const building = String(value.building ?? "").trim(), location = String(value.location ?? "").trim(), category = String(value.category ?? "").trim();
    const status = ["Operational", "Attention", "Offline"].includes(String(value.status)) ? String(value.status) : "Operational";
    if (!id || !name || !building || !location || !category) return NextResponse.json({ error: "Complete all equipment fields." }, { status: 400 });
    await ensureDatabase();
    const result = await pool.query("INSERT INTO equipment (id,name,mm,building,location,category,status,updated) VALUES ($1,$2,$3,$4,$5,$6,$7,'just now') RETURNING *", [id,name,mm,building,location,category,status]);
    return NextResponse.json({ equipment: asEquipment(result.rows[0]) }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ error: "That equipment ID is already in use." }, { status: 409 });
    console.error("Equipment create failed", error); return NextResponse.json({ error: "Equipment could not be added." }, { status: 500 });
  }
}
