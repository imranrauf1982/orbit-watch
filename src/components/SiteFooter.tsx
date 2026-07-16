import Link from "next/link";

const CONTACT_EMAIL = "info@orbitmap.space";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Live Map", href: "/app" },
      { label: "What's Above Me?", href: "/app?feature=above-me" },
      { label: "Next Pass Alerts", href: "/app?feature=next-pass" },
      { label: "Products", href: "/products" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Account", href: "/account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" width="22" height="22" fill="none" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="footerLogoGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fe7f2" />
          <stop offset="1" stopColor="#3aa9c2" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="8.4" fill="url(#footerLogoGrad)" />
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

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-void">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
              <LogoMark />
              OrbitMap
            </Link>
            <p className="mt-3 max-w-[26ch] text-sm leading-relaxed text-muted">
              Live 3D satellite &amp; ISS tracking, built on public orbital data.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink/80 transition-colors hover:text-orbit">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {year} OrbitMap · Not affiliated with NASA, ESA, or any space agency.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
