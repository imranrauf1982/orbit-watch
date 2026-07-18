import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Contact form endpoint. Persists submissions to the `contact_submissions`
// table (see supabase/contact_submissions.sql) using the service_role key,
// which is why this must stay a server Route Handler and never be called
// directly from the browser with the anon key.

const VALID_INQUIRY_TYPES = new Set([
  "affiliate",
  "sponsor",
  "product_listing",
  "suggestion",
  "other",
]);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    inquiryType?: string;
    description?: string;
    // Honeypot field — real users never fill this in (hidden via CSS on
    // the form). If it arrives non-empty, treat the submission as spam.
    company?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const inquiryType = (body.inquiryType ?? "other").trim();
  const description = (body.description ?? "").trim();
  const honeypot = (body.company ?? "").trim();

  if (!name || name.length > 200) {
    return NextResponse.json({ ok: false, error: "Enter your name." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (!VALID_INQUIRY_TYPES.has(inquiryType)) {
    return NextResponse.json({ ok: false, error: "Select a valid inquiry type." }, { status: 400 });
  }
  if (!description || description.length > 5000) {
    return NextResponse.json(
      { ok: false, error: "Add a short description (under 5000 characters)." },
      { status: 400 }
    );
  }

  // Hash the caller's IP (never store it raw) purely for basic rate-limit /
  // abuse triage later. Falls back gracefully if the header isn't present.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ipHash = ip ? createHash("sha256").update(ip).digest("hex") : null;

  const { error } = await supabaseAdmin.from("contact_submissions").insert({
    name,
    email,
    inquiry_type: inquiryType,
    description,
    source_page: "/contact",
    user_agent: req.headers.get("user-agent") ?? null,
    ip_hash: ipHash,
    is_likely_spam: honeypot.length > 0,
  });

  if (error) {
    console.error("contact_submissions insert failed:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong on our end. Please try emailing us directly." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
