import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const session = readSession(request);
  return NextResponse.json({ session: session ? { name: session.name, email: session.email, role: session.role } : null });
}
