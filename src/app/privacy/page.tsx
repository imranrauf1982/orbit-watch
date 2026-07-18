import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal/Legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — OrbitMap",
  description:
    "How OrbitMap collects, uses, and protects information, including location data, cookies, advertising, and analytics.",
};

const LAST_UPDATED = "July 18, 2026";
const CONTACT_EMAIL = "info@orbitmap.space";

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Back to home
        </Link>

        <span className={styles.kicker}>Legal</span>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>

        <p className={styles.sectionText}>
          <strong>
            OrbitMap is committed to protecting your privacy. We collect minimal data, process
            location information locally in your browser, and use advertising and affiliate links
            to keep the live satellite tracker free.
          </strong>
        </p>

        <p className={styles.intro}>
          This Privacy Policy explains what information OrbitMap (&ldquo;OrbitMap,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;) collects when you use{" "}
          <strong>orbitmap.space</strong> (the &ldquo;Service&rdquo;), how we use it, and the
          choices you have. By using the Service, you agree to the practices described here. If
          you don&apos;t agree, please don&apos;t use the Service.
        </p>

        <nav className={styles.toc} aria-label="Table of contents">
          <a href="#information-we-collect">Information We Collect</a>
          <a href="#location">Location Data</a>
          <a href="#cookies-ads">Cookies &amp; Advertising</a>
          <a href="#affiliate">Affiliate Links</a>
          <a href="#third-party">Third-Party Services</a>
          <a href="#storage">Local Storage</a>
          <a href="#retention">Data Retention &amp; Security</a>
          <a href="#children">Children&apos;s Privacy</a>
          <a href="#rights">Your Rights &amp; Choices</a>
          <a href="#changes">Changes to This Policy</a>
          <a href="#contact">Contact</a>
        </nav>

        <section id="information-we-collect" className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
          <p className={styles.sectionText}>We collect a limited amount of information:</p>
          <ul className={styles.list}>
            <li>
              <strong>Usage &amp; device data:</strong> browser type, device type, general region
              (derived from IP address), pages visited, and how you interact with the Service.
              This is typically collected automatically by our hosting provider and any analytics
              or advertising scripts running on the site.
            </li>
            <li>
              <strong>Precise location (optional):</strong> if you grant permission, we access
              your device&apos;s GPS/location via your browser to power features like &ldquo;What&apos;s
              Above Me&rdquo; and &ldquo;Next Pass.&rdquo; See <a href="#location">Location Data</a>{" "}
              below for how this is handled.
            </li>
            <li>
              <strong>Email address (optional):</strong> if you sign up for a pass-alert
              notification, we collect the email address and satellite you provide, used solely to
              send you that notification.
            </li>
            <li>
              <strong>Cookies &amp; similar technologies:</strong> used for basic site functionality
              and by advertising partners, described in <a href="#cookies-ads">Cookies &amp;
              Advertising</a>.
            </li>
          </ul>
          <p className={styles.sectionText}>
            We do not require an account to use OrbitMap, and we do not knowingly collect payment
            information, government ID numbers, or other sensitive personal data.
          </p>
        </section>

        <section id="location" className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Location Data</h2>
          <p className={styles.sectionText}>
            Location-based features are opt-in and use your browser&apos;s built-in Geolocation
            API. Your coordinates are used locally, in your browser, to calculate things like
            what&apos;s currently overhead or when a satellite will next be visible from where you
            are. We do not store your precise location on our servers, sell it, or share it with
            advertisers. You can deny or revoke location permission at any time through your
            browser or device settings, and the Service will continue to work without it (with
            location-based features unavailable).
          </p>
        </section>

        <section id="cookies-ads" className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Cookies &amp; Advertising</h2>
          <p className={styles.sectionText}>
            OrbitMap may display advertising, including through <strong>Google AdSense</strong> and
            other ad networks, to help support the cost of running the Service. These networks may
            use cookies, device identifiers, or similar technologies to serve ads based on your
            visit to this and other websites.
          </p>
          <ul className={styles.list}>
            <li>
              Google and its partners use cookies to serve ads based on a user&apos;s prior visits
              to this site or other sites on the internet.
            </li>
            <li>
              You can opt out of personalized advertising by visiting Google&apos;s{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
                Ads Settings
              </a>{" "}
              or{" "}
              <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
                www.aboutads.info/choices
              </a>
              .
            </li>
            <li>
              Most browsers let you block or delete cookies through their settings; doing so may
              affect how parts of the Service function.
            </li>
            <li>
              We use a cookie consent banner to comply with applicable privacy regulations (such
              as GDPR).
            </li>
          </ul>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>In short</h3>
            <p className={styles.infoText}>
              We don&apos;t control what data third-party ad networks collect once their scripts
              load in your browser — their own privacy policies govern that data. We only control
              the data described in this policy that OrbitMap itself collects.
            </p>
          </div>
        </section>

        <section id="affiliate" className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Affiliate Links</h2>
          <p className={styles.sectionText}>
            Some pages on OrbitMap, including blog posts and product mentions, may contain
            affiliate links. If you click one of these links and make a qualifying purchase, we
            may earn a small commission at no additional cost to you. Affiliate relationships never
            influence the accuracy of the satellite tracking data we display. Full details are in
            our <Link href="/terms">Terms of Service</Link>.
          </p>
        </section>

        <section id="third-party" className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Third-Party Services We Use</h2>
          <p className={styles.sectionText}>OrbitMap relies on a small number of external services:</p>
          <ul className={styles.list}>
            <li>
              <strong>CelesTrak</strong> — public source of satellite orbital data (TLEs). We send
              requests to CelesTrak to fetch this data; no personal data is transmitted as part of
              that request.
            </li>
            <li>
              <strong>OpenStreetMap Nominatim</strong> — used for optional place-name search and
              reverse geocoding when you type a location instead of sharing GPS.
            </li>
            <li>
              <strong>Hosting &amp; infrastructure providers</strong> (e.g. Vercel) — process
              standard web request logs (IP address, request time, etc.) as part of serving the
              site.
            </li>
            <li>
              <strong>Advertising networks</strong> (e.g. Google AdSense) — described above.
            </li>
          </ul>
          <p className={styles.sectionText}>
            Each of these services has its own privacy practices, and we encourage you to review
            them if you have concerns about a specific provider.
          </p>
        </section>

        <section id="storage" className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Local Storage on Your Device</h2>
          <p className={styles.sectionText}>
            To make the app more useful, some preferences are saved directly in your browser&apos;s
            local storage rather than on our servers, including: favorited satellites, saved pass
            alerts, and accessibility preferences (like high-contrast mode). This data stays on
            your device and is not transmitted to us. Clearing your browser data will remove it.
          </p>
        </section>

        <section id="retention" className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Data Retention &amp; Security</h2>
          <p className={styles.sectionText}>
            We retain the limited data we collect (such as email addresses submitted for pass
            alerts) only for as long as needed to provide that feature, or until you ask us to
            delete it. We take reasonable technical measures to protect information in our
            control, but no method of transmission or storage is 100% secure, and we can&apos;t
            guarantee absolute security.
          </p>
        </section>

        <section id="children" className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Children&apos;s Privacy</h2>
          <p className={styles.sectionText}>
            OrbitMap is not directed at children under 13, and we do not knowingly collect
            personal information from children under 13. If you believe a child has provided us
            with personal information, please contact us and we will delete it.
          </p>
        </section>

        <section id="rights" className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Your Rights &amp; Choices</h2>
          <p className={styles.sectionText}>
            Depending on where you live, you may have rights to access, correct, or delete
            personal information we hold about you, or to object to certain processing (for
            example, under the GDPR in the EU/UK or the CCPA/CPRA in California). To exercise any
            of these rights, contact us at the email below and we&apos;ll respond within a
            reasonable time.
          </p>
          <p className={styles.sectionText}>
            To request deletion of your email address (from pass alerts) or any other personal
            data we hold, please email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject &ldquo;Data
            Deletion Request&rdquo;.
          </p>
        </section>

        <section id="changes" className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Changes to This Policy</h2>
          <p className={styles.sectionText}>
            We may update this Privacy Policy from time to time. Material changes will be
            reflected by updating the &ldquo;Last updated&rdquo; date at the top of this page.
            Continued use of the Service after changes are posted constitutes acceptance of the
            revised policy.
          </p>
        </section>

        <div id="contact" className={styles.contactBox}>
          <p>Questions about this policy?</p>
          <a className={styles.contactEmail} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>

        <p className={styles.crossLink}>
          Also see our <Link href="/terms">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}
