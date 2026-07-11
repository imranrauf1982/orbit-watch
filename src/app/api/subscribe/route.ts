import { NextResponse } from "next/server";

// Lightweight stub: validates and accepts the signup so the UI has a real
// endpoint to call. Wire this up to an email provider (Resend, Mailgun,
// ConvertKit, etc.) once pass-alert delivery is built — nothing is persisted
// server-side yet, so treat this as a "we got your interest" endpoint.
export async function POST(req: Request) {
  let body: { email?: string; satelliteId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!validEmail) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
