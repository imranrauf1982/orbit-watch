import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "Track the ISS, Hubble, Tiangong, and more in a live 3D orbital map. Real-time positions from public TLE data, plus visible-pass predictions for your exact location — free, no signup.";

export const metadata: Metadata = {
  title: "Orbit Watch — Live ISS & Satellite Tracker | Real-Time 3D Orbital Map",
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
  metadataBase: new URL("https://example.com"),
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
    title: "Orbit Watch",
  },
  openGraph: {
    title: "Orbit Watch — Live ISS & Satellite Tracker",
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: "Orbit Watch",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbit Watch — Live ISS & Satellite Tracker",
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
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-void text-ink font-body antialiased">{children}</body>
    </html>
  );
}
