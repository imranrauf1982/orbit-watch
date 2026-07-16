import Link from "next/link";
import type { Metadata } from "next";
import styles from "../Blog.module.css";

export const metadata: Metadata = {
  title: "How TLE Data Works — OrbitMap Blog",
  description:
    "Every satellite on OrbitMap is powered by two dense lines of text. Here's what a TLE actually contains, and how software turns it into a live position.",
};

export default function HowTleDataWorksPost() {
  return (
    <div className={styles.page}>
      <div className={styles.postContainer}>
        <Link href="/blog" className={styles.backToBlog}>
          ← All posts
        </Link>

        <div className={styles.postHeaderMeta}>
          <span>Explainer</span>
          <span>·</span>
          <span>Jul 2026</span>
          <span>·</span>
          <span>6 min read</span>
        </div>

        <h1 className={styles.postHeadline}>
          How TLE Data Works: The Numbers Behind Every Satellite&apos;s Position
        </h1>

        <p className={styles.postDek}>
          Every dot moving across OrbitMap is powered by two dense lines of numbers called a{" "}
          <strong>Two-Line Element set</strong>, or TLE. Here&apos;s what&apos;s actually packed
          into those lines, and how they become a live, moving satellite on your screen.
        </p>

        <div className={styles.articleBody}>
          <p>
            If you&apos;ve ever opened a satellite-tracking site and glanced at the raw data
            behind it, you&apos;ve probably seen something like this: two lines of closely packed
            numbers and letters, seemingly unreadable. That format is a TLE, and it&apos;s been the
            backbone of satellite tracking since the 1970s.
          </p>

          <h2>What a TLE actually contains</h2>
          <p>
            A TLE is a compact snapshot of a satellite&apos;s orbit at a specific moment in time.
            Rather than storing a full trajectory, it stores a small set of orbital parameters —
            things like inclination (the tilt of the orbit relative to the equator), eccentricity
            (how circular or stretched the orbit is), and mean motion (how many times the
            satellite circles Earth per day). From those handful of numbers, well-established
            physics can reconstruct where the satellite will be at any future moment, at least for
            a while.
          </p>
          <ul>
            <li>
              <strong>Epoch</strong> — the exact reference time the orbital data was measured.
            </li>
            <li>
              <strong>Inclination</strong> — the angle between the orbit and Earth&apos;s equator.
            </li>
            <li>
              <strong>Eccentricity</strong> — how elliptical the orbit is.
            </li>
            <li>
              <strong>Mean motion</strong> — orbits completed per day.
            </li>
          </ul>

          <h2>Where the data comes from</h2>
          <p>
            OrbitMap sources its TLEs from <strong>CelesTrak</strong>, a long-running, free,
            public catalog of orbital data for active satellites. CelesTrak refreshes its data
            regularly using tracking measurements, and publishes it openly so that developers,
            hobbyists, and researchers can build tools like this one without needing their own
            ground-station network.
          </p>

          <div className={styles.adSlot}>Advertisement</div>

          <h2>From two lines of text to a moving dot</h2>
          <p>
            Turning a TLE into an actual position requires an orbital propagation model — software
            that takes those parameters and calculates latitude, longitude, and altitude for any
            requested moment in time. OrbitMap uses the industry-standard{" "}
            <strong>SGP4/SDP4</strong> model, the same family of algorithms used across the
            satellite-tracking world, to do this calculation directly in your browser as time
            passes.
          </p>
          <p>
            This is also why satellite positions on any tracker — including OrbitMap — are
            technically <strong>estimates</strong>. A TLE becomes gradually less accurate the
            further you get from its epoch, which is why fresh data matters and why long-range
            predictions (like exact pass times weeks from now) carry more uncertainty than
            &ldquo;where is it right now.&rdquo;
          </p>

          <h2>Why this matters if you're watching the sky</h2>
          <p>
            Understanding that satellite positions come from a model — not a live GPS feed off the
            satellite itself — helps set the right expectations. It&apos;s part of why we&apos;re
            upfront in our{" "}
            <Link href="/terms" style={{ color: "var(--cyan-soft)", textDecoration: "underline" }}>
              Terms of Service
            </Link>{" "}
            that OrbitMap is built for learning and curiosity, not for navigation or
            safety-critical use.
          </p>

          <div className={styles.affiliateCard}>
            <span className={styles.affiliateLabel}>Gear pick</span>
            <h3 className={styles.affiliateTitle}>Want a closer look next time the ISS passes over?</h3>
            <p className={styles.affiliateText}>
              A basic pair of 10x50 binoculars is enough to make out the ISS&apos;s shape on a
              clear pass — no telescope required. (This section may contain affiliate links; see
              our disclosure below.)
            </p>
          </div>

          <p className={styles.disclosureNote}>
            Some links in this article may be affiliate links, meaning OrbitMap may earn a small
            commission on qualifying purchases at no extra cost to you. This never affects the
            accuracy of the tracking data we publish. Full details in our{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
