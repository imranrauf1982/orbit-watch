"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Launch App", href: "/app" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Blog", href: "/blog" },
];

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="navLogoGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fe7f2" />
          <stop offset="1" stopColor="#3aa9c2" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="8.4" fill="url(#navLogoGrad)" />
      <ellipse
        cx="16"
        cy="16"
        rx="14.5"
        ry="5.2"
        transform="rotate(-22 16 16)"
        stroke="#4fd8eb"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.8 20c1.4-3.6 4.2-5.4 7.2-5.4s5.8 1.8 7.2 5.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu automatically whenever the route changes, and
  // whenever the viewport is resized up to desktop width.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
          <LogoMark />
          <span className="leading-tight">
            OrbitMap
            <span className="ml-1.5 align-middle text-[9px] font-semibold tracking-[0.22em] text-muted">
              WATCH
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href) ? "text-orbit" : "text-muted hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/app"
            className="hidden items-center rounded-full bg-signal px-4 py-2 text-sm font-semibold text-void transition-transform hover:scale-[1.03] active:scale-[0.98] sm:inline-flex"
          >
            Launch App
          </Link>

          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted transition-colors hover:text-ink sm:flex"
          >
            <IconUser />
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-ink md:hidden"
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={`grid overflow-hidden border-t border-white/5 bg-void/95 backdrop-blur-xl transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 flex flex-col px-4 py-2 sm:px-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`border-b border-white/5 py-3.5 text-[15px] font-medium last:border-none ${
                isActive(link.href) ? "text-orbit" : "text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/account"
            className="border-b border-white/5 py-3.5 text-[15px] font-medium text-ink last:border-none"
          >
            Account
          </Link>
          <Link
            href="/app"
            className="my-3 rounded-full bg-signal px-4 py-3 text-center text-sm font-semibold text-void"
          >
            Launch App
          </Link>
        </div>
      </nav>
    </header>
  );
}
