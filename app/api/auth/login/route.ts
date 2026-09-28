import { NextRequest, NextResponse } from "next/server";
import { createSession, setAuthCookie, verifyPassword } from "@/lib/auth";
import { ensureDatabase, pool } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, password, mode } = await request.json() as { email?: unknown; password?: unknown; mode?: unknown };
    const email = String(rawEmail ?? "").trim().toLowerCase();
    if (!email || typeof password !== "string") return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    let user: { name: string; email: string; role: "admin" | "staff" } | null = null;
    if (mode === "admin") {
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminEmail || !adminPassword) return NextResponse.json({ error: "Administrator credentials are not configured." }, { status: 503 });
      const a = Buffer.from(password), b = Buffer.from(adminPassword);
      const validPassword = a.length === b.length && (await import("node:crypto")).timingSafeEqual(a, b);
      if (email === adminEmail && validPassword) user = { name: "Administrator", email: adminEmail, role: "admin" };
    } else {
      await ensureDatabase();
      const result = await pool.query("SELECT name,email,password_hash FROM app_users WHERE email=$1", [email]);
      const row = result.rows[0];
      if (row && verifyPassword(password, row.password_hash)) user = { name: row.name, email: row.email, role: "staff" };
    }
    if (!user) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    const response = NextResponse.json({ session: { name: user.name, email: user.email, role: user.role } });
    setAuthCookie(response, createSession(user));
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Sign in is temporarily unavailable." }, { status: 500 });
  }
}
