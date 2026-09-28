import { NextRequest, NextResponse } from "next/server";
import { allowed } from "@/lib/auth";
import { asTicket, ensureDatabase, pool } from "@/lib/db";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!allowed(request, "admin")) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    const { id } = await context.params, { status } = await request.json() as { status?: unknown };
    const validStatus = String(status);
    if (!["Open", "In progress", "Resolved"].includes(validStatus)) return NextResponse.json({ error: "Invalid maintenance status." }, { status: 400 });
    await ensureDatabase();
    const result = await pool.query("UPDATE maintenance_requests SET status=$2 WHERE id=$1 RETURNING *", [id,validStatus]);
    if (!result.rowCount) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    return NextResponse.json({ ticket: asTicket(result.rows[0]) });
  } catch (error) { console.error("Maintenance update failed", error); return NextResponse.json({ error: "Request could not be updated." }, { status: 500 }); }
}
