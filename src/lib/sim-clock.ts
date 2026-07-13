"use client";

// A tiny external store (no context needed) that lets any part of the app
// read "what time is it right now, simulation-adjusted" and lets the HUD
// control playback speed / pause — without threading props through every
// component that calls propagate().
//
// getSimTime() is what components call instead of `new Date()` wherever the
// simulated clock should apply (satellite propagation). Real-world clocks
// (Footer's wall clock, "fetched at" timestamps) should keep using
// `new Date()` directly — this is only for the simulated orbital view.

type Listener = () => void;

let speed = 1; // multiplier: 1 = real time, 10 = 10x, etc. Can be negative for reverse.
let paused = false;
let anchorRealMs = Date.now();
let anchorSimMs = Date.now();
const listeners = new Set<Listener>();

// useSyncExternalStore compares snapshots by reference — returning a fresh
// object literal on every call (as this used to do) makes React think the
// store changed on every render and causes an infinite update loop. Cache
// the snapshot and only replace it when speed/paused actually change.
let snapshot = { speed, paused };
function updateSnapshot() {
  snapshot = { speed, paused };
}

function rebaseAnchor() {
  anchorSimMs = getSimTime().getTime();
  anchorRealMs = Date.now();
}

export function getSimTime(): Date {
  if (paused) return new Date(anchorSimMs);
  const elapsedRealMs = Date.now() - anchorRealMs;
  return new Date(anchorSimMs + elapsedRealMs * speed);
}

export function getSimSpeed() {
  return speed;
}

export function isSimPaused() {
  return paused;
}

export function setSimSpeed(next: number) {
  rebaseAnchor();
  speed = next;
  if (next !== 0) paused = false;
  updateSnapshot();
  listeners.forEach((l) => l());
}

export function toggleSimPaused() {
  rebaseAnchor();
  paused = !paused;
  updateSnapshot();
  listeners.forEach((l) => l());
}

export function resetSimClock() {
  rebaseAnchor();
  speed = 1;
  paused = false;
  updateSnapshot();
  listeners.forEach((l) => l());
}

export function subscribeSimClock(cb: Listener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSimClockSnapshot() {
  return snapshot;
}
