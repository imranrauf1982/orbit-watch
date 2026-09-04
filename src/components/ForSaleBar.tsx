// Sticky "for sale" announcement bar — rendered only on the homepage
// (src/app/page.tsx), never in the shared root layout, so it can't leak
// onto /app or any other route. No client state needed, so this stays a
// plain server component.

import styles from "@/app/Home.module.css";

const SALE_EMAIL = "info@orbitmap.space"; // same contact email already used elsewhere on the site
const SALE_SUBJECT = "OrbitMap — Offer Inquiry";

export default function ForSaleBar() {
  const mailtoHref = `mailto:${SALE_EMAIL}?subject=${encodeURIComponent(SALE_SUBJECT)}`;

  return (
    <div className={styles.forSaleBar} role="banner">
      <span className={styles.forSaleBarText}>
        🚀 OrbitMap is for sale — Domain + Full Source Code
      </span>
      <a href={mailtoHref} className={styles.forSaleBarCta}>
        Contact / Make an Offer
      </a>
    </div>
  );
}
