"use client";

import { useState } from "react";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import styles from "./Home.module.css";

// Loaded only for this page — kept out of the shared root layout so it
// never touches the tracker app's own type system. Aliased to
// --font-display-landing and referenced solely inside Home.module.css.
const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-landing",
  display: "swap",
});

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Home", href: "/" },
  { label: "App", href: "/app" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Products", href: "/products" },
];

const CONTACT_EMAIL = "info@orbitmap.space";

const FAQ_ITEMS = [
  {
    question: "Is OrbitMap free to use?",
    answer:
      "Yes! The live 3D tracker and all core features are completely free with no signup required.",
  },
  {
    question: "How accurate is the satellite tracking?",
    answer:
      "Very accurate for casual and educational use. Positions are calculated from public TLE data and updated regularly. Not intended for professional navigation or safety-critical decisions.",
  },
  {
    question: "What satellites can I track?",
    answer:
      "ISS, Hubble, Tiangong, Starlink, weather satellites, Earth observation satellites, and over 14,000 other objects.",
  },
  {
    question: "Do you store my location data?",
    answer:
      'No. Location is processed locally in your browser only when you use features like "What\'s Above Me". We never store or share it.',
  },
  {
    question: "How do you make money?",
    answer:
      "Through Amazon affiliate links (recommended gear) and non-intrusive advertising. This helps keep the tracker free.",
  },
];

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 12h17M12 3.5c2.6 2.4 4 5.4 4 8.5s-1.4 6.1-4 8.5c-2.6-2.4-4-5.4-4-8.5s1.4-6.1 4-8.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function IconSatellite() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
      <rect
        x="8.6"
        y="8.6"
        width="6.8"
        height="6.8"
        rx="1.2"
        transform="rotate(45 12 12)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3.5 5.5l3.4 3.4M20.5 18.5l-3.4-3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M1.8 3l3.2 3.2M19 17l3.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="19" cy="5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
      <circle cx="12" cy="12.5" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4.7l3.2 1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

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

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SatelliteGraphic({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      {/* left solar panel */}
      <rect x="2" y="24" width="16" height="16" rx="1.5" fill="#3aa9c2" stroke="#8fe7f2" strokeWidth="1.2" />
      <path d="M4 28h12M4 32h12M4 36h12" stroke="#0a2e36" strokeWidth="0.8" />
      {/* right solar panel */}
      <rect x="46" y="24" width="16" height="16" rx="1.5" fill="#3aa9c2" stroke="#8fe7f2" strokeWidth="1.2" />
      <path d="M48 28h12M48 32h12M48 36h12" stroke="#0a2e36" strokeWidth="0.8" />
      {/* panel struts */}
      <path d="M18 32h8M38 32h8" stroke="#8fe7f2" strokeWidth="1.4" strokeLinecap="round" />
      {/* body */}
      <rect x="24" y="22" width="16" height="20" rx="3" fill="#e9f7fa" stroke="#4fd8eb" strokeWidth="1.4" />
      <circle cx="32" cy="30" r="2.6" fill="#4fd8eb" />
      {/* antenna */}
      <path d="M32 22V12" stroke="#eef2fa" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="32" cy="10.5" r="2.2" fill="none" stroke="#eef2fa" strokeWidth="1.4" />
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

const FEATURE_CARDS = [
  {
    id: "where-am-i",
    title: "Where Am I?",
    hint: "See the live line between you and any satellite",
    icon: <IconGlobe />,
    feature: "where-am-i",
  },
  {
    id: "above-me",
    title: "What's Above Me?",
    hint: "Find out what's overhead right now",
    icon: <IconSatellite />,
    feature: "above-me",
  },
  {
    id: "next-pass",
    title: "Next Pass",
    hint: "Get notified before it's visible",
    icon: <IconClock />,
    feature: "next-pass",
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className={`${styles.page} ${displayFont.variable}`}>
      <div className={styles.starsFar} aria-hidden />
      <div className={styles.stars} aria-hidden />
      <div className={styles.nebula} aria-hidden />

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

      <main className={styles.main}>
        {/* Hero + Features stay grouped in their own wrapper so the existing
            desktop "fits above the fold, no scroll" behavior (defined on
            .main at >=860px) still centers just this block — new content
            below flows normally instead of being squeezed into that box. */}
        <div className={styles.foldWrap}>
          <section className={styles.hero}>
            <span className={styles.heroKicker}>
              <span className={styles.heroKickerDot} />
              LIVE ORBITAL DATA
            </span>

            <h1 className={styles.headline}>Track Satellites &amp; ISS in Real-Time</h1>

            <p className={styles.subheadline}>
              Live 3D Orbital Map<span className={styles.subheadlineDivider}>•</span>See What&apos;s
              Above You
            </p>

            <div className={styles.ctaRow}>
              <Link href="/app" className={styles.ctaPrimary}>
                Launch App
                <IconArrow />
              </Link>
            </div>

            <div className={styles.orbitStage} aria-hidden>
              <div className={styles.earthGlow} />
              <div className={styles.earth} />
              <div className={styles.earthRim} />
              <SatelliteGraphic className={`${styles.orbitSatellite} ${styles.orbitSatellite1}`} />
              <SatelliteGraphic className={`${styles.orbitSatellite} ${styles.orbitSatellite2}`} />
              <SatelliteGraphic className={`${styles.orbitSatellite} ${styles.orbitSatellite3}`} />
            </div>
          </section>

          <section className={styles.featuresWrap} aria-label="Quick actions">
            <div className={styles.featuresGrid}>
              {FEATURE_CARDS.map((card) => (
                <Link
                  key={card.id}
                  href={`/app?feature=${card.feature}`}
                  className={styles.featureCard}
                >
                  <span className={styles.featureIcon}>{card.icon}</span>
                  <span>
                    <span className={styles.featureTitle}>{card.title}</span>
                    <span className={styles.featureHint}>{card.hint}</span>
                  </span>
                  <span className={styles.featureArrow}>
                    <IconArrow />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* How It Works Section */}
        <section className={styles.howItWorks} aria-label="How OrbitMap works">
          <div className={styles.sectionHeader}>
            <h2>How OrbitMap Works</h2>
            <p>Real-time satellite tracking made simple and accurate</p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Fetch Public Orbital Data</h3>
              <p>
                We pull live Two-Line Element (TLE) data from{" "}
                <a
                  href="https://celestrak.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.inlineLink}
                >
                  CelesTrak
                </a>
                , a trusted public catalog used by NASA and astronomers worldwide.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Calculate Live Positions</h3>
              <p>
                Using the industry-standard SGP4/SDP4 model, positions are computed
                continuously in your browser.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Render Beautiful 3D Views</h3>
              <p>
                Interactive globe, sky view, and pass predictions — all running
                locally for speed and privacy. See it live in the{" "}
                <Link href="/app" className={styles.inlineLink}>
                  app
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={styles.faqSection} aria-label="Frequently asked questions">
          <div className={styles.sectionHeader}>
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className={styles.faqGrid}>
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className={styles.faqItem}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </main>

      <footer className={styles.footer} id="contact">
        <div className={styles.footerLeft}>
          <span className={styles.footerBrand}>OrbitMap Watch</span>
          <span className={styles.footerCopy}>
            © {new Date().getFullYear()} OrbitMap ·{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.footerLink}>
              {CONTACT_EMAIL}
            </a>
          </span>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/about" className={styles.footerLink}>
            About
          </Link>
          <Link href="/products" className={styles.footerLink}>
            Products
          </Link>
          <Link href="/blog" className={styles.footerLink}>
            Blog
          </Link>
          <Link href="/app" className={styles.footerLink}>
            Launch App
          </Link>
          <Link href="/contact" className={styles.footerLink}>
            Contact
          </Link>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy
          </Link>
          <Link href="/terms" className={styles.footerLink}>
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
