import { NextResponse } from "next/server";

// Lightweight stub: validates and accepts the signup so the UI has a real
// endpoint to call. Wire this up to an email provider (Resend, Mailgun,
// ConvertKit, etc.) once pass-alert delivery is built — nothing is persisted
// server-side yet, so treat this as a "we got your interest" endpoint.
//
// Hardening added:
// - Per-IP rate limiting (best-effort, in-memory)
// - Honeypot field to silently drop bot submissions
// - Stricter input validation (length caps, type checks)
//
// NOTE on rate limiting: this uses an in-memory Map, which only limits
// requests within a single serverless instance. On Vercel, multiple
// instances/cold starts mean a determined attacker can bypass this. It's a
// reasonable first line of defense against basic bots, but if abuse becomes
// a real problem, move the counter to Supabase or an edge store (e.g.
// Upstash Redis) for a durable, cross-instance limit.

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // per IP per window

type Bucket = { count: number; windowStart: number };
const rateLimitBuckets = new Map<string, Bucket>();

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);

  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  bucket.count += 1;
  return false;
}

// Occasionally trim old buckets so the Map doesn't grow unbounded over the
// life of a warm serverless instance.
function pruneOldBuckets() {
  const now = Date.now();
  for (const [ip, bucket] of rateLimitBuckets) {
    if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitBuckets.delete(ip);
    }
  }
}

const MAX_EMAIL_LENGTH = 254; // RFC 5321 practical limit
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
  pruneOldBuckets();

  let body: { email?: string; satelliteId?: number; company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot: a hidden form field named "company" that real users never
  // fill in. If it has anything in it, silently pretend success so bots
  // don't learn their submission was rejected, without doing any real work.
  if (typeof body.company === "string" && body.company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = (body.email ?? "").trim();

  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }

  if (
    body.satelliteId !== undefined &&
    (typeof body.satelliteId !== "number" || !Number.isFinite(body.satelliteId))
  ) {
    return NextResponse.json({ ok: false, error: "Invalid satellite id" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
