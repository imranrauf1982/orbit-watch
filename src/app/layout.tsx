import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// Premium humanist sans — powers all headings, body copy, labels, and
// button text. Kept as one family (mapped to --font-sans, with --font-display
// and --font-body aliased to it in tailwind.config.ts) so every existing
// font-display / font-body className in the app upgrades automatically.
const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Numeric/coordinate streams (lat/lon, UTC, velocity, etc.) stay monospace
// for readability — untouched by the visual refresh.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "Track the ISS, Hubble, Tiangong, and more in a live 3D orbital map. Real-time positions from public TLE data, plus visible-pass predictions for your exact location — free, no signup.";

export const metadata: Metadata = {
  title: "OrbitMap — Live ISS & Satellite Tracker | Real-Time 3D Orbital Map",
  description: SITE_DESCRIPTION,
  keywords: [
    "ISS tracker",
    "satellite tracker",
    "live satellite map",
    "ISS pass predictions",
    "when to see the ISS",
    "Hubble tracker",
    "orbital map",
    "satellite visibility",
  ],
  metadataBase: new URL("https://www.orbitmap.space"),
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OrbitMap",
  },
  openGraph: {
    title: "OrbitMap — Live ISS & Satellite Tracker",
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: "OrbitMap",
    url: "https://www.orbitmap.space",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrbitMap — Live ISS & Satellite Tracker",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${mono.variable} font-sans antialiased`}>
      <body className="bg-void text-ink antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
