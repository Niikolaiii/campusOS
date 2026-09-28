import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export type AppRole = "admin" | "staff";
export type AppSession = { name: string; email: string; role: AppRole; exp: number };
export const SESSION_COOKIE = "campusops_session";
const lifetime = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return value;
}
function sign(body: string) { return createHmac("sha256", secret()).update(body).digest("base64url"); }
export function createSession(session: Omit<AppSession, "exp">) {
  const body = Buffer.from(JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + lifetime })).toString("base64url");
  return `${body}.${sign(body)}`;
}
export function readSession(request: NextRequest): AppSession | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AppSession;
    if (data.exp < Date.now() / 1000 || !["admin", "staff"].includes(data.role)) return null;
    return data;
  } catch { return null; }
}
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", maxAge: lifetime,
  });
}
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex"), actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function setAuthCookie(response: NextResponse, token: string) { setSessionCookie(response, token); }
export function allowed(request: NextRequest, role?: AppRole) {
  const session = readSession(request);
  if (!session || (role && session.role !== role)) return null;
  return session;
}
