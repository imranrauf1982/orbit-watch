"use client";

import { useState } from "react";

const INQUIRY_TYPES: { value: string; label: string; hint: string }[] = [
  {
    value: "affiliate",
    label: "Affiliate partnership",
    hint: "You want to offer OrbitMap an affiliate deal for your product or service.",
  },
  {
    value: "sponsor",
    label: "Sponsorship",
    hint: "You'd like to sponsor OrbitMap or a specific feature.",
  },
  {
    value: "product_listing",
    label: "List a product or service",
    hint: "You have a space-related product/service you'd like featured on the site.",
  },
  {
    value: "suggestion",
    label: "Suggestion / feedback",
    hint: "Ideas, feature requests, or feedback on the app.",
  },
  {
    value: "other",
    label: "Other",
    hint: "Anything else — press, questions, bug reports.",
  },
];

type FormState = "idle" | "sending" | "done" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState("affiliate");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState(""); // honeypot — must stay empty
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;

    if (!name.trim() || !email.trim() || !description.trim()) {
      setError("Please fill in your name, email, and a short description.");
      return;
    }

    setState("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, inquiryType, description, company }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setState("error");
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("done");
    } catch {
      setState("error");
      setError("Network error — please try again in a moment.");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-orbit/30 bg-orbit/5 px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orbit/15">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="#4FD8EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">Message sent</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Thanks for reaching out — we read every submission and will get back to you at the
          email you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {/* Honeypot field — hidden from real users, bots tend to fill every field */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-orbit"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-orbit"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          What's this about?
        </label>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {INQUIRY_TYPES.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border px-4 py-3 transition-colors ${
                inquiryType === opt.value
                  ? "border-orbit bg-orbit/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="inquiryType"
                  value={opt.value}
                  checked={inquiryType === opt.value}
                  onChange={() => setInquiryType(opt.value)}
                  className="h-3.5 w-3.5 accent-[#4FD8EB]"
                />
                <span className="text-sm font-medium text-ink">{opt.label}</span>
              </div>
              <span className="pl-5 text-xs leading-snug text-muted">{opt.hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-xs font-semibold uppercase tracking-[0.1em] text-muted"
        >
          Description
        </label>
        <textarea
          id="description"
          required
          maxLength={5000}
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us about your product, service, or query — links are welcome."
          className="resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-orbit"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs font-medium text-warn">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex items-center justify-center rounded-full bg-signal px-6 py-3 text-sm font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
