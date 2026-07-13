"use client";

// Lightweight external store for favorited satellite NORAD IDs, persisted
// to localStorage. Mirrors the sim-clock.ts pattern already used in this
// codebase (module-level store + useSyncExternalStore) so any component can
// read/toggle favorites without prop-drilling through the whole tree.

const STORAGE_KEY = "orbitwatch_favorites_v1";

let favorites: number[] = [];
let snapshot: number[] = favorites;
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) favorites = parsed.filter((n) => typeof n === "number");
    }
  } catch {
    /* malformed/unavailable storage — start empty */
  }
  snapshot = favorites;
}
load();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    /* storage full or unavailable — favorites just won't persist this session */
  }
}

function notify() {
  snapshot = [...favorites];
  listeners.forEach((l) => l());
}

export function isFavorite(id: number): boolean {
  return favorites.includes(id);
}

export function toggleFavorite(id: number) {
  favorites = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
  persist();
  notify();
}

export function subscribeFavorites(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getFavoritesSnapshot() {
  return snapshot;
}

export function getFavoritesServerSnapshot(): number[] {
  return [];
}
