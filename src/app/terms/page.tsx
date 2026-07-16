import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal/Legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service — OrbitMap",
  description:
    "Terms of Service for OrbitMap, including accuracy disclaimers, affiliate and advertising disclosures, and intellectual property notices.",
};

const LAST_UPDATED = "July 16, 2026";
const CONTACT_EMAIL = "info@orbitmap.space";

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Back to home
        </Link>

        <span className={styles.kicker}>Legal</span>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>

        <p className={styles.intro}>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of{" "}
          <strong>orbitmap.space</strong> (the &ldquo;Service&rdquo;), operated by OrbitMap
          (&ldquo;we,&rdquo; &ldquo;us&rdquo;). By accessing or using the Service, you agree to
          these Terms. If you don&apos;t agree, please don&apos;t use the Service.
        </p>

        <nav className={styles.toc} aria-label="Table of contents">
          <a href="#description">Description of Service</a>
          <a href="#accuracy">Accuracy Disclaimer</a>
          <a href="#no-warranty">No Warranty</a>
          <a href="#liability">Limitation of Liability</a>
          <a href="#ip">Intellectual Property &amp; Trademarks</a>
          <a href="#advertising">Advertising Disclosure</a>
          <a href="#affiliate">Affiliate Disclosure</a>
          <a href="#third-party">Third-Party Data &amp; Links</a>
          <a href="#conduct">Acceptable Use</a>
          <a href="#changes">Changes to the Service or Terms</a>
          <a href="#law">Governing Law</a>
          <a href="#contact">Contact</a>
        </nav>

        <section id="description" className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Description of Service</h2>
          <p className={styles.sectionText}>
            OrbitMap is an informational and educational tool that visualizes the estimated
            real-time positions of satellites, including the International Space Station, using
            publicly available orbital tracking data. It is provided for curiosity, learning, and
            casual sky-watching purposes.
          </p>
        </section>

        <section id="accuracy" className={styles.section}>
          <div className={styles.calloutCard}>
            <h2 className={styles.calloutTitle}>2. Accuracy Disclaimer — please read</h2>
            <p className={styles.calloutText}>
              Satellite positions, trajectories, visibility predictions, and pass times displayed
              on OrbitMap are <strong>estimates</strong> calculated from publicly published
              orbital data (TLEs) using standard propagation models. This data can be delayed,
              incomplete, or occasionally inaccurate, and predictions naturally become less
              precise further into the future.
            </p>
            <p className={styles.calloutText} style={{ marginTop: 10 }}>
              <strong>
                OrbitMap must not be used for navigation, aviation, spaceflight operations,
                collision avoidance, targeting, or any safety-critical or operational decision.
              </strong>{" "}
              It is not a substitute for authoritative, operational tracking systems. Use the
              Service at your own risk and judgment.
            </p>
          </div>
        </section>

        <section id="no-warranty" className={styles.section}>
          <h2 className={styles.sectionTitle}>3. No Warranty</h2>
          <p className={styles.sectionText}>
            The Service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available,&rdquo;</strong>{" "}
            without warranties of any kind, whether express, implied, or statutory, including but
            not limited to warranties of merchantability, fitness for a particular purpose, title,
            and non-infringement. We do not warrant that the Service will be uninterrupted,
            error-free, or that any data displayed will be accurate or current.
          </p>
        </section>

        <section id="liability" className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Limitation of Liability</h2>
          <p className={styles.sectionText}>
            To the fullest extent permitted by law, OrbitMap and its operators will not be liable
            for any indirect, incidental, special, consequential, or punitive damages, or any loss
            of data, use, goodwill, or other intangible losses, arising from or related to your use
            of, or inability to use, the Service — even if we&apos;ve been advised of the
            possibility of such damages. Some jurisdictions do not allow certain limitations of
            liability, so some of the above may not apply to you.
          </p>
        </section>

        <section id="ip" className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Intellectual Property &amp; Trademarks</h2>
          <p className={styles.sectionText}>
            The OrbitMap name, logo, design, and original code and content are the property of
            OrbitMap unless otherwise noted. Satellite names (e.g. ISS, Hubble, Starlink,
            Tiangong), imagery, and any related trademarks or brand names referenced or displayed
            on this site are the property of their respective owners — including space agencies,
            satellite operators, and manufacturers — and are used solely for identification and
            educational purposes.
          </p>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>No affiliation or endorsement</h3>
            <p className={styles.infoText}>
              OrbitMap is not affiliated with, sponsored by, or endorsed by NASA, ESA, Roscosmos,
              CNSA, SpaceX, CelesTrak, or any other space agency, satellite operator, or
              manufacturer referenced on this site. Any use of a name, image, or trademark belonging
              to these organizations is made under fair use for identification and reference, not
              to imply any partnership.
            </p>
          </div>
          <p className={styles.sectionText}>
            If you believe content on this site infringes your copyright or trademark rights,
            contact us at the email below with details and we will promptly investigate and, where
            appropriate, remove or correct the material.
          </p>
        </section>

        <section id="advertising" className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Advertising Disclosure</h2>
          <p className={styles.sectionText}>
            OrbitMap may display advertisements served by third-party networks, including Google
            AdSense, to help support the cost of operating the Service. Ads are clearly
            distinguishable from OrbitMap&apos;s own content and are not endorsements by OrbitMap
            of any advertiser, product, or service. See our{" "}
            <Link href="/privacy">Privacy Policy</Link> for details on advertising cookies and how
            to opt out of personalized ads.
          </p>
        </section>

        <section id="affiliate" className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Affiliate Disclosure</h2>
          <p className={styles.sectionText}>
            OrbitMap participates in affiliate marketing programs. This means some links on this
            site — for example, in blog posts recommending telescopes, binoculars, or other
            stargazing equipment — are affiliate links. If you click through and make a qualifying
            purchase, we may earn a commission at no extra cost to you. We only recommend products
            we believe are genuinely relevant to our audience, but affiliate compensation may
            influence which products we choose to feature. This disclosure is made in accordance
            with FTC guidelines on endorsements and testimonials.
          </p>
        </section>

        <section id="third-party" className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Third-Party Data &amp; Links</h2>
          <p className={styles.sectionText}>
            OrbitMap displays data sourced from CelesTrak and uses OpenStreetMap&apos;s Nominatim
            service for location search. We don&apos;t control, and aren&apos;t responsible for,
            the accuracy, availability, or content of these or any other third-party services or
            websites linked from OrbitMap, including affiliate and advertiser links. Use of those
            services is governed by their own terms.
          </p>
        </section>

        <section id="conduct" className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Acceptable Use</h2>
          <p className={styles.sectionText}>You agree not to:</p>
          <ul className={styles.list}>
            <li>Use the Service for any unlawful purpose or in violation of these Terms;</li>
            <li>
              Attempt to scrape, overload, or interfere with the normal operation of the Service or
              the third-party data sources it relies on;
            </li>
            <li>
              Misrepresent OrbitMap data as authoritative or operational tracking information; or
            </li>
            <li>Reverse-engineer or misuse the Service in a way that harms other users.</li>
          </ul>
        </section>

        <section id="changes" className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Changes to the Service or Terms</h2>
          <p className={styles.sectionText}>
            We may modify or discontinue the Service, in whole or in part, at any time. We may
            also update these Terms periodically; continued use of the Service after changes are
            posted constitutes your acceptance of the revised Terms. We&apos;ll update the
            &ldquo;Last updated&rdquo; date above when changes are made.
          </p>
        </section>

        <section id="law" className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Governing Law</h2>
          <p className={styles.sectionText}>
            These Terms are governed by the laws of the jurisdiction in which OrbitMap operates,
            without regard to conflict-of-law principles.{" "}
            <em>(Update this section with your specific country/state before publishing.)</em>
          </p>
        </section>

        <div id="contact" className={styles.contactBox}>
          <p>Questions about these Terms?</p>
          <a className={styles.contactEmail} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>

        <p className={styles.crossLink}>
          Also see our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
