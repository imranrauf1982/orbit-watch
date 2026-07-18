"use client";

// Extracted from the homepage so only this small interactive bit (the
// mobile menu toggle) needs to ship as client JS. Everything else on the
// homepage is static markup and can be server-rendered, which cuts the
// JS bundle mobile devices have to download/parse/execute before the
// page becomes interactive (helps FCP/LCP/TBT on low-end phones).

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/Home.module.css";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Home", href: "/" },
  { label: "App", href: "/app" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Products", href: "/products" },
];

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.8 20c1.4-3.6 4.2-5.4 7.2-5.4s5.8 1.8 7.2 5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg
      className={styles.logoIcon}
      viewBox="0 0 32 32"
      width="26"
      height="26"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="orbitmapLogoGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fe7f2" />
          <stop offset="1" stopColor="#3aa9c2" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="8.4" fill="url(#orbitmapLogoGrad)" />
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

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <LogoMark />
        <span>
          OrbitMap
          <span className={styles.logoSub}>WATCH</span>
        </span>
      </Link>

      <nav className={styles.navDesktop} aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`${styles.navLink} ${link.href === "/" ? styles.navLinkActive : ""}`}
            onClick={handleNavClick}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.headerRight}>
        <Link href="/account" className={styles.profileBtn} aria-label="Account">
          <IconUser />
        </Link>
        <button
          className={styles.menuBtn}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {menuOpen && (
        <nav className={styles.mobileNav} aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={styles.mobileNavLink}
              onClick={handleNavClick}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
