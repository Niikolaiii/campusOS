import { NextRequest, NextResponse } from "next/server";
import { allowed } from "@/lib/auth";
import { asEquipment, ensureDatabase, pool } from "@/lib/db";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!allowed(request, "admin")) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    const { id } = await context.params, { status } = await request.json() as { status?: unknown };
    const validStatus = String(status);
    if (!["Operational", "Attention", "Offline"].includes(validStatus)) return NextResponse.json({ error: "Invalid equipment status." }, { status: 400 });
    await ensureDatabase();
    const result = await pool.query("UPDATE equipment SET status=$2,updated='just now' WHERE id=$1 RETURNING *", [id,validStatus]);
    if (!result.rowCount) return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
    return NextResponse.json({ equipment: asEquipment(result.rows[0]) });
  } catch (error) { console.error("Equipment update failed", error); return NextResponse.json({ error: "Equipment could not be updated." }, { status: 500 }); }
}
