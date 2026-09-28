import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSession, hashPassword, setAuthCookie } from "@/lib/auth";
import { ensureDatabase, pool } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const { name: rawName, email: rawEmail, password, inviteCode } = await request.json() as { name?: unknown; email?: unknown; password?: unknown; inviteCode?: unknown };
    const name = String(rawName ?? "").trim(), email = String(rawEmail ?? "").trim().toLowerCase();
    const expectedInvite = process.env.STAFF_INVITE_CODE;
    if (!expectedInvite) return NextResponse.json({ error: "Staff registration is not configured." }, { status: 503 });
    const supplied = Buffer.from(String(inviteCode ?? "")), expected = Buffer.from(expectedInvite);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: "The staff invitation code is not valid." }, { status: 403 });
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Enter a valid name and email, and use a password of at least eight characters." }, { status: 400 });
    }
    await ensureDatabase();
    const result = await pool.query("INSERT INTO app_users (email,name,password_hash) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING email,name", [email, name, hashPassword(password)]);
    if (!result.rowCount) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const user = { name: result.rows[0].name, email: result.rows[0].email, role: "staff" as const };
    const response = NextResponse.json({ session: { name: user.name, email: user.email, role: user.role } }, { status: 201 });
    setAuthCookie(response, createSession(user));
    return response;
  } catch (error) {
    console.error("Account creation failed", error);
    return NextResponse.json({ error: "Account creation is temporarily unavailable." }, { status: 500 });
  }
}
