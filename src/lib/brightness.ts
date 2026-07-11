import type { CatalogEntry } from "./satellite-catalog";

export type BrightnessTier = "very-bright" | "bright" | "moderate" | "faint";

export type BrightnessEstimate = {
  tier: BrightnessTier;
  label: string;
  /** Short human hint for naked-eye spotting difficulty. */
  hint: string;
};

// Rough baseline apparent-magnitude ranges per object type. These are NOT
// computed from a physical brightness model (that needs cross-section/albedo
// data no public TLE carries) — they're reasonable, commonly-cited ballparks
// used to give first-time observers a sense of what to expect.
const CATEGORY_BASELINE: Record<CatalogEntry["category"], number> = {
  station: -2.5, // ISS / Tiangong — routinely the brightest thing in the sky after the Moon
  telescope: 1.5, // Hubble — visible but modest
  constellation: 3.5, // Starlink/Iridium — faint individually, occasional bright flares
  weather: 4.5,
  science: 4.5,
};

/**
 * Rough naked-eye visibility tier for a pass, blending the satellite's
 * category with how high it climbs (higher = shorter atmospheric path =
 * effectively brighter and easier to pick out from the horizon haze).
 */
export function estimateBrightness(
  category: CatalogEntry["category"],
  maxElevationDeg: number
): BrightnessEstimate {
  const baseline = CATEGORY_BASELINE[category];
  // Elevation bonus: near the zenith looks up to ~1 magnitude better than near the horizon.
  const elevationBonus = (Math.min(Math.max(maxElevationDeg, 0), 90) / 90) * 1.2;
  const effective = baseline - elevationBonus;

  if (effective <= -1.5) {
    return {
      tier: "very-bright",
      label: "Very bright",
      hint: "Easy to spot — brighter than most stars",
    };
  }
  if (effective <= 1) {
    return {
      tier: "bright",
      label: "Bright",
      hint: "Should stand out against most skies",
    };
  }
  if (effective <= 3.5) {
    return {
      tier: "moderate",
      label: "Moderate",
      hint: "Visible in darker skies, away from city lights",
    };
  }
  return {
    tier: "faint",
    label: "Faint",
    hint: "Needs a very dark sky, binoculars may help",
  };
}
