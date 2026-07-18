"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Loaded on demand instead of statically, so their code isn't pulled into
// the shared layout bundle that every route — including "/" and "/app",
// which never render them — has to download.
const Navbar = dynamic(() => import("./Navbar"));
const SiteFooter = dynamic(() => import("./SiteFooter"));

// The live 3D tracker (/app) is a full-screen immersive experience with its
// own HUD-style footer — it should never get the marketing chrome. The
// homepage (/) already ships its own bespoke header + footer tailored to
// its hero section, so we skip it here too rather than double up.
const NO_CHROME_PREFIXES = ["/app"];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const skipChrome = pathname === "/" || NO_CHROME_PREFIXES.some((p) => pathname.startsWith(p));

  if (skipChrome) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
