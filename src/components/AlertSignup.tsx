"use client";

import { useState } from "react";

type Props = {
  satelliteId: number;
  satelliteName: string;
};

export default function AlertSignup({ satelliteId, satelliteName }: Props) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot — real users never see or fill this
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) return;
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, satelliteId, company }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      setState("done");
      setMessage(`You're on the list for ${satelliteName} pass alerts.`);
    } catch {
      setState("error");
      setMessage("Network error — try again in a moment.");
    }
  };

  if (state === "done") {
    return (
      <p className="text-[11px] text-signal font-mono py-1">{message}</p>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <p className="text-[11px] text-muted font-body mb-1.5">
        Get an email before the next good pass (coming soon — join early):
      </p>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-xl bg-void border border-white/5 px-2.5 py-1.5 text-xs text-ink placeholder:text-muted font-body focus:border-signal outline-none"
        />
        <button
          onClick={submit}
          disabled={state === "sending"}
          className="rounded-xl border border-signal/40 bg-signal/10 px-2.5 py-1.5 text-[11px] font-mono text-signal hover:bg-signal/20 disabled:opacity-50 shrink-0"
        >
          {state === "sending" ? "…" : "NOTIFY ME"}
        </button>
      </div>
      {state === "error" && <p className="mt-1 text-[11px] text-warn font-mono">{message}</p>}
    </div>
  );
}
