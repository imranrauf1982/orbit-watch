"use client";

import { useState } from "react";
import { searchPlace, type GeocodeResult } from "@/lib/geocode";

type Props = {
  onPick: (lat: number, lon: number) => void;
};

export default function LocationSearch({ onPick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const found = await searchPlace(query);
      setResults(found);
      if (found.length === 0) setError("No matches — try a city, zip, or landmark name.");
    } catch {
      setError("Search failed — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Search city or zip…"
          className="min-w-0 flex-1 rounded-xl bg-void border border-white/5 px-2.5 py-1.5 text-xs text-ink placeholder:text-muted font-body focus:border-signal outline-none"
        />
        <button
          onClick={runSearch}
          disabled={loading}
          className="rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] px-2.5 py-1.5 text-[11px] font-mono text-ink hover:border-signal/40 disabled:opacity-50 shrink-0"
        >
          {loading ? "…" : "GO"}
        </button>
      </div>

      {error && <p className="mt-1.5 text-[11px] text-warn font-mono">{error}</p>}

      {results && results.length > 0 && (
        <ul className="mt-1.5 divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden">
          {results.map((r, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  onPick(r.lat, r.lon);
                  setResults(null);
                  setQuery(r.displayName.split(",")[0]);
                }}
                className="w-full text-left px-2.5 py-1.5 text-[11px] text-muted hover:text-ink hover:bg-white/5 font-body truncate"
                title={r.displayName}
              >
                {r.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
