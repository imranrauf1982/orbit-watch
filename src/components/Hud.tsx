"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Fuse from "fuse.js";
import {
  SATELLITE_CATALOG,
  CATEGORY_LABEL,
  CATEGORY_COLOR,
  FILTER_GROUP_LABEL,
  bulkObjectGroup,
  bulkObjectColor,
  type FilterGroup,
  type CatalogEntry,
} from "@/lib/satellite-catalog";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";
import type { ObserverLocation, LocationStatus } from "@/lib/use-location";
import type { ViewMode } from "./OrbitWatchApp";
import SatellitePanel from "./SatellitePanel";
import AboutModal from "./AboutModal";
import SupportModal from "./SupportModal";
import Footer from "./Footer";
import OnboardingTutorial from "./OnboardingTutorial";
import QuickActions from "./QuickActions";
import {
  getSimClockSnapshot,
  subscribeSimClock,
  setSimSpeed,
  toggleSimPaused,
} from "@/lib/sim-clock";
import { useHighContrast } from "@/lib/use-high-contrast";

type Props = {
  satellites: TleResult[];
  catalogStatus: "loading" | "ready" | "error";
  selectedId: number | null;
  liveState: LiveState | null;
  onSelect: (id: number | null) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  location: ObserverLocation | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onManualLocation: (lat: number, lon: number) => void;
  filter: FilterGroup;
  onFilterChange: (filter: FilterGroup) => void;
  showDots: boolean;
  onShowDotsChange: (show: boolean) => void;
  showOrbitPaths: boolean;
  onShowOrbitPathsChange: (show: boolean) => void;
  flyMode: boolean;
  onToggleFlyMode: (next: boolean) => void;
  onShowLocateLine: (id: number) => void;
  onHideLocateLine: () => void;
};

type ListItem = {
  id: number;
  name: string;
  categoryLabel: string;
  color: string;
  featured: boolean;
};

const ROW_HEIGHT = 52; // px — must match the row's rendered height below
const OVERSCAN = 6;

export default function Hud({
  satellites,
  catalogStatus,
  selectedId,
  liveState,
  onSelect,
  viewMode,
  onViewModeChange,
  location,
  locationStatus,
  onRequestLocation,
  onManualLocation,
  filter,
  onFilterChange,
  showDots,
  onShowDotsChange,
  showOrbitPaths,
  onShowOrbitPathsChange,
  flyMode,
  onToggleFlyMode,
  onShowLocateLine,
  onHideLocateLine,
}: Props) {
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highContrast, setHighContrast] = useHighContrast();

  // Playback speed (3D view). Subscribed to the module-level sim-clock store
  // so any component can read/drive it without prop drilling.
  const simClock = useSyncExternalStore(subscribeSimClock, getSimClockSnapshot, () => ({
    speed: 1,
    paused: false,
  }));
  const SPEED_STEPS = [1, 10, 60, 600, 3600];

  // First-visit onboarding — shows once, reopenable anytime via HELP or "?".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem("orbitwatch_onboarded")) {
      setTutorialOpen(true);
    }
  }, []);
  const dismissTutorial = () => {
    setTutorialOpen(false);
    window.localStorage.setItem("orbitwatch_onboarded", "1");
  };

  // Keyboard shortcuts: 1/2/3 switch views, / focuses search, Esc closes
  // panels, space pauses/resumes sim time, +/- change playback speed,
  // c toggles high-contrast, ? opens help. Ignored while typing in a field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      if (e.key === "/" && !typing) {
        e.preventDefault();
        setListOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
        return;
      }
      if (e.key === "Escape") {
        if (listOpen) setListOpen(false);
        else if (selectedId !== null) onSelect(null);
        return;
      }
      if (typing) return;

      if (e.key === "1") onViewModeChange("3d");
      else if (e.key === "2") onViewModeChange("map");
      else if (e.key === "3") onViewModeChange("sky");
      else if (e.key === " ") {
        e.preventDefault();
        toggleSimPaused();
      } else if (e.key === "+" || e.key === "=") {
        const idx = SPEED_STEPS.indexOf(Math.abs(simClock.speed)) ;
        setSimSpeed(SPEED_STEPS[Math.min(idx + 1, SPEED_STEPS.length - 1)] || SPEED_STEPS[1]);
      } else if (e.key === "-" || e.key === "_") {
        const idx = SPEED_STEPS.indexOf(Math.abs(simClock.speed));
        setSimSpeed(SPEED_STEPS[Math.max(idx - 1, 0)] || SPEED_STEPS[0]);
      } else if (e.key === "c" || e.key === "C") {
        setHighContrast((v) => !v);
      } else if (e.key === "?") {
        setTutorialOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listOpen, selectedId, simClock.speed]);

  // Flatten TLE results + curated catalog into one searchable/listable shape.
  // Kept minimal (Phase 4: this list can run into the thousands under the
  // "All Active" filter, so no heavy per-item objects).
  const allItems = useMemo<ListItem[]>(() => {
    return satellites.map((s) => {
      const entry = SATELLITE_CATALOG.find((c) => c.id === s.id);
      if (entry) {
        return {
          id: entry.id,
          name: entry.name,
          categoryLabel: CATEGORY_LABEL[entry.category],
          color: CATEGORY_COLOR[entry.category],
          featured: true,
        };
      }
      const group = bulkObjectGroup(s.name, s.id);
      return {
        id: s.id,
        name: s.name,
        categoryLabel: group === "starlink" ? "Starlink" : group === "station" ? "Space Station" : "Active",
        color: bulkObjectColor(s.name, s.id),
        featured: false,
      };
    });
  }, [satellites]);

  const filteredByGroup = useMemo(() => {
    if (filter === "featured") return allItems.filter((i) => i.featured);
    if (filter === "starlink")
      return allItems.filter((i) => i.featured || bulkObjectGroup(i.name, i.id) === "starlink");
    if (filter === "stations")
      return allItems.filter((i) => i.featured || bulkObjectGroup(i.name, i.id) === "station");
    return allItems;
  }, [allItems, filter]);

  const fuse = useMemo(
    () => new Fuse(allItems, { keys: ["name"], threshold: 0.35, ignoreLocation: true }),
    [allItems]
  );

  // Searching intentionally ignores the active filter tab — a search is a
  // request to find a specific object regardless of which group it's in.
  // (Previously this searched only within the current tab, which made
  // anything outside "Featured" report as "not matched" even when it
  // genuinely existed in the data.)
  const available = useMemo(() => {
    if (!query.trim()) return filteredByGroup;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, filteredByGroup]);

  // --- Lightweight manual list virtualization (Phase 4) ---
  // The "All Active" filter can put thousands of rows in this list; only
  // the rows actually in the scrollport (plus a small overscan) get mounted.
  const scrollRef = useRef<HTMLUListElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    setViewportHeight(el.clientHeight);
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [listOpen]);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    available.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
  );
  const visibleRows = available.slice(startIndex, endIndex);

  const selectedEntry: CatalogEntry | null = useMemo(() => {
    if (selectedId === null) return null;
    const featured = SATELLITE_CATALOG.find((c) => c.id === selectedId);
    if (featured) return featured;
    const sat = satellites.find((s) => s.id === selectedId);
    if (!sat) return null;
    // Non-featured selection (picked from search/list/map/point-cloud) —
    // synthesize a CatalogEntry so SatellitePanel doesn't need two code paths.
    const group = bulkObjectGroup(sat.name, sat.id);
    return {
      id: sat.id,
      name: sat.name,
      category: group === "station" ? "station" : "constellation",
    };
  }, [selectedId, satellites]);

  const selectedTle = satellites.find((s) => s.id === selectedId) ?? null;

  const handleShare = () => {
    if (selectedId === null || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("sat", String(selectedId));
    navigator.clipboard?.writeText(url.toString()).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    });
    window.history.replaceState(null, "", url.toString());
  };

  const filterGroups: FilterGroup[] = ["featured", "starlink", "stations", "all"];

  return (
    <div className="pointer-events-none absolute inset-0 z-[2000] flex flex-col">
      {/* Header */}
      <header className="pointer-events-auto flex flex-wrap items-start justify-between gap-x-4 gap-y-3 p-4 sm:p-6">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-display text-xl sm:text-2xl font-bold tracking-tight">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full border border-orbit/40 text-orbit shrink-0"
              style={{ boxShadow: "0 0 18px -2px rgba(79,216,235,0.55)" }}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                <ellipse
                  cx="12"
                  cy="12"
                  rx="9.5"
                  ry="4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  transform="rotate(-24 12 12)"
                />
              </svg>
            </span>
            <span className="text-ink">ORBIT</span>{" "}
            <span className="text-orbit" style={{ textShadow: "0 0 22px rgba(79,216,235,0.45)" }}>
              WATCH
            </span>
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted font-body">
            Live positions from real orbital element data
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 max-w-full">
          {/* 3D / Map / Sky view toggle */}
          <div className="flex rounded-xl border border-white/5 bg-space-900/60 backdrop-blur-xl overflow-hidden text-[11px] font-mono shadow-[0_4px_20px_-6px_rgba(0,0,0,0.6)]">
            <button
              onClick={() => onViewModeChange("3d")}
              className={`px-3 py-1.5 transition-all duration-300 ease-out ${
                viewMode === "3d" ? "bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]" : "text-muted hover:text-ink"
              }`}
              aria-pressed={viewMode === "3d"}
            >
              3D
            </button>
            <button
              onClick={() => onViewModeChange("map")}
              className={`px-3 py-1.5 border-l border-white/5 transition-all duration-300 ease-out ${
                viewMode === "map" ? "bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]" : "text-muted hover:text-ink"
              }`}
              aria-pressed={viewMode === "map"}
            >
              MAP
            </button>
            <button
              onClick={() => onViewModeChange("sky")}
              className={`px-3 py-1.5 border-l border-white/5 transition-all duration-300 ease-out ${
                viewMode === "sky" ? "bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]" : "text-muted hover:text-ink"
              }`}
              aria-pressed={viewMode === "sky"}
            >
              SKY
            </button>
          </div>

          {viewMode === "3d" && (
            <div className="flex rounded-xl border border-white/5 bg-space-900/60 backdrop-blur-xl overflow-hidden text-[11px] font-mono shadow-[0_4px_20px_-6px_rgba(0,0,0,0.6)]">
              <button
                onClick={() => toggleSimPaused()}
                className={`px-2.5 py-1.5 transition-all duration-300 ease-out ${
                  simClock.paused ? "bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]" : "text-muted hover:text-ink"
                }`}
                title="Pause/resume simulated time (Space)"
                aria-pressed={simClock.paused}
              >
                {simClock.paused ? "▶" : "❚❚"}
              </button>
              {SPEED_STEPS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s)}
                  className={`px-2 py-1.5 border-l border-white/5 transition-all duration-300 ease-out ${
                    !simClock.paused && simClock.speed === s
                      ? "bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]"
                      : "text-muted hover:text-ink"
                  }`}
                  title={`Run simulation at ${s}x speed`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighContrast((v) => !v)}
              className={`rounded-xl border h-8 px-2.5 flex items-center justify-center text-[11px] font-mono backdrop-blur-xl transition-all duration-300 ease-out ${
                highContrast
                  ? "border-signal/40 bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]"
                  : "border-white/5 bg-space-900/60 text-muted hover:text-ink"
              }`}
              aria-pressed={highContrast}
              title="Toggle high-contrast mode (C)"
            >
              <span className="hidden sm:inline">CONTRAST</span>
              <span className="sm:hidden" aria-hidden>
                ◐
              </span>
            </button>
            <button
              onClick={() => setTutorialOpen(true)}
              className="rounded-xl border border-white/5 bg-space-900/60 h-8 px-2.5 flex items-center justify-center text-[11px] font-mono text-muted hover:text-ink backdrop-blur-xl transition-all duration-300 ease-out"
              aria-label="Help & keyboard shortcuts"
              title="Help & keyboard shortcuts (?)"
            >
              ?
            </button>
            <button
              onClick={() => setSupportOpen(true)}
              className="rounded-xl border border-white/5 bg-space-900/60 h-8 px-2.5 flex items-center justify-center gap-1 text-[11px] font-mono text-signal hover:text-ink backdrop-blur-xl transition-all duration-300 ease-out"
              aria-label="Support Orbit Watch"
              title="Support Orbit Watch"
            >
              <span aria-hidden>♥</span>
              <span className="hidden sm:inline">SUPPORT</span>
            </button>
            <button
              onClick={() => setAboutOpen(true)}
              className="rounded-xl border border-white/5 bg-space-900/60 h-8 px-2.5 flex items-center justify-center text-[11px] font-mono text-muted hover:text-ink backdrop-blur-xl transition-all duration-300 ease-out"
              aria-label="About Orbit Watch"
              title="About & data sources"
            >
              ABOUT
            </button>
            <button
              onClick={() => setListOpen((v) => !v)}
              className="sm:hidden rounded-xl border border-white/5 bg-space-900/60 h-8 px-3 flex items-center justify-center text-[11px] font-mono text-ink backdrop-blur-xl transition-all duration-300 ease-out"
              aria-expanded={listOpen}
            >
              {listOpen ? "CLOSE" : "TARGETS"}
            </button>
          </div>
        </div>
      </header>

      <QuickActions
        satellites={satellites}
        selectedId={selectedId}
        onSelect={onSelect}
        location={location}
        locationStatus={locationStatus}
        onRequestLocation={onRequestLocation}
        onManualLocation={onManualLocation}
        flyMode={flyMode}
        onToggleFlyMode={onToggleFlyMode}
        onShowLocateLine={onShowLocateLine}
        onHideLocateLine={onHideLocateLine}
      />

      <div className="flex-1" />

      <Footer
        onAbout={() => setAboutOpen(true)}
        onSupport={() => setSupportOpen(true)}
        raised={Boolean(selectedEntry && selectedTle)}
      />

      {/* Satellite list — sidebar on desktop, sheet on mobile */}
      <div
        className={`pointer-events-auto fixed sm:absolute right-0 top-0 sm:top-20 h-full sm:h-auto sm:max-h-[70vh] w-full sm:w-72 sm:rounded-l-xl border-l border-white/5 bg-space-900/60 backdrop-blur-xl transition-transform duration-300 sm:translate-x-0 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.7)] ${
          listOpen ? "translate-x-0" : "translate-x-full sm:translate-x-0"
        } flex flex-col`}
      >
        <div className="p-3 border-b border-white/5 space-y-2">
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search satellite…"
            className="w-full rounded-xl bg-void border border-white/5 px-3 py-2 text-sm text-ink placeholder:text-muted font-body focus:border-signal outline-none"
          />
          <div className="flex flex-wrap gap-1">
            {filterGroups.map((g) => (
              <button
                key={g}
                onClick={() => onFilterChange(g)}
                className={`rounded-md px-2 py-1 text-[10px] font-mono border transition-all duration-300 ease-out ${
                  filter === g
                    ? "border-signal/40 bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]"
                    : "border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-muted hover:text-ink"
                }`}
                aria-pressed={filter === g}
              >
                {FILTER_GROUP_LABEL[g]}
              </button>
            ))}
          </div>
          {filter !== "featured" && (
            <button
              onClick={() => onShowDotsChange(!showDots)}
              className={`w-full rounded-md px-2 py-1.5 text-[10px] font-mono border transition-all duration-300 ease-out flex items-center justify-center gap-1.5 ${
                showDots
                  ? "border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-muted hover:text-ink"
                  : "border-signal/40 bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]"
              }`}
              aria-pressed={!showDots}
              title="Toggle the background satellite dots on or off"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: showDots ? "#4FD8EB" : "#3A4152" }}
              />
              {showDots ? "HIDE DOTS" : "SHOW DOTS"}
            </button>
          )}
          {viewMode === "3d" && (
            <button
              onClick={() => onShowOrbitPathsChange(!showOrbitPaths)}
              className={`w-full rounded-md px-2 py-1.5 text-[10px] font-mono border transition-all duration-300 ease-out flex items-center justify-center gap-1.5 ${
                showOrbitPaths
                  ? "border-signal/40 bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)]"
                  : "border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-muted hover:text-ink"
              }`}
              aria-pressed={showOrbitPaths}
              title="Toggle full orbital paths for featured satellites"
            >
              {showOrbitPaths ? "HIDE ORBITS" : "SHOW ORBITS"}
            </button>
          )}
          <p className="text-[10px] text-muted font-mono">
            {available.length.toLocaleString()} object{available.length === 1 ? "" : "s"}
            {catalogStatus === "loading" && " · loading full catalog…"}
            {!showDots && filter !== "featured" && " · dots hidden"}
          </p>
        </div>
        <ul
          ref={scrollRef}
          className="overflow-y-auto flex-1 relative"
          style={{ transform: "translateZ(0)" }}
        >
          <li style={{ height: available.length * ROW_HEIGHT }} className="relative">
            {visibleRows.map((entry, i) => {
              const index = startIndex + i;
              return (
                <button
                  key={entry.id}
                  onClick={() => {
                    onSelect(entry.id);
                    setListOpen(false);
                  }}
                  style={{
                    transform: `translateY(${index * ROW_HEIGHT}px)`,
                    height: ROW_HEIGHT,
                    willChange: "transform",
                  }}
                  className={`absolute left-0 right-0 top-0 text-left px-3 flex items-center gap-2.5 border-b border-white/5 hover:bg-white/5 transition-all duration-300 ease-out ${
                    selectedId === entry.id ? "bg-white/5" : ""
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-ink truncate font-body">{entry.name}</span>
                    <span className="block text-[11px] text-muted font-mono">
                      {entry.categoryLabel}
                    </span>
                  </span>
                </button>
              );
            })}
          </li>
          {available.length === 0 && catalogStatus === "loading" && (query.trim() || filter !== "featured") && (
            <li className="px-3 py-6 text-center text-sm text-muted font-body">
              Still loading the full satellite catalog — try again in a moment.
            </li>
          )}
          {available.length === 0 && !(catalogStatus === "loading" && (query.trim() || filter !== "featured")) && (
            <li className="px-3 py-6 text-center text-sm text-muted font-body">
              No matches. Try another name.
            </li>
          )}
        </ul>
      </div>

      {/* Satellite panel: live telemetry, orbital info, upcoming passes */}
      {selectedEntry && selectedTle && (
        <SatellitePanel
          key={selectedEntry.id}
          entry={selectedEntry}
          line1={selectedTle.line1}
          line2={selectedTle.line2}
          liveState={liveState}
          location={location}
          locationStatus={locationStatus}
          onRequestLocation={onRequestLocation}
          onManualLocation={onManualLocation}
          onClose={() => onSelect(null)}
          onShare={handleShare}
          shareCopied={shareCopied}
        />
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
      {tutorialOpen && <OnboardingTutorial onClose={dismissTutorial} />}
    </div>
  );
}
