import Link from "next/link";
import type { Metadata } from "next";
import styles from "./About.module.css";

export const metadata: Metadata = {
  title: "About — OrbitMap",
  description:
    "OrbitMap is a real-time satellite and ISS tracker built on public CelesTrak orbital data. Learn how it works, where the data comes from, and its limitations.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.stars} aria-hidden />

      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Back to home
        </Link>

        <div className={styles.hero}>
          <span className={styles.kicker}>About OrbitMap</span>

          <h1 className={styles.title}>Real orbits, real data, right in your browser</h1>

          <p className={styles.lead}>
            OrbitMap turns publicly available orbital tracking data into a live, explorable 3D map —
            so anyone can see where the International Space Station, weather satellites, and
            thousands of other objects actually are right now, without needing a background in
            orbital mechanics.
          </p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Why we built it</h2>
          <p className={styles.sectionText}>
            Satellite tracking data has been publicly available for decades, but most tools that
            present it are built for engineers and hobbyist radio operators. We wanted something
            different: a map that a curious person could open, immediately understand, and use to
            answer three simple questions — <strong>what&apos;s above me right now</strong>,{" "}
            <strong>where am I relative to a satellite I care about</strong>, and{" "}
            <strong>when will it be visible from where I&apos;m standing</strong>.
          </p>
          <p className={styles.sectionText}>
            OrbitMap is an independent, self-funded project. It isn&apos;t affiliated with NASA,
            ESA, Roscosmos, SpaceX, or any space agency or satellite operator — we&apos;re simply
            developers and space enthusiasts who wanted a better way to visualize what&apos;s
            overhead.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Where the data comes from</h2>
          <p className={styles.sectionText}>
            Every satellite position shown on OrbitMap is calculated from{" "}
            <strong>Two-Line Element (TLE) data</strong> — a compact orbital format published by{" "}
            <strong>CelesTrak</strong>, a free, publicly accessible catalog of tracking data for
            active satellites. We don&apos;t operate any ground stations or tracking hardware
            ourselves; we fetch this public data on a regular schedule and do the orbital math
            client-side, in your browser.
          </p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Orbital propagation</h3>
              <p className={styles.cardText}>
                We use the industry-standard SGP4/SDP4 propagation model to calculate each
                satellite&apos;s current latitude, longitude, altitude, and velocity from its TLE.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Update frequency</h3>
              <p className={styles.cardText}>
                Orbital elements are refreshed roughly every hour. Positions between refreshes are
                computed continuously, so the map stays live even between data updates.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>What&apos;s tracked</h3>
              <p className={styles.cardText}>
                A curated set of well-known satellites (the ISS, Hubble, Tiangong, weather and
                Earth-observation satellites) alongside a much larger catalog of thousands of
                additional tracked objects, including Starlink.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Runs in your browser</h3>
              <p className={styles.cardText}>
                There&apos;s no account system and no server-side database. Your location, if you
                share it, is used locally to power features like &ldquo;What&apos;s Above
                Me&rdquo; and is never stored on our servers.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How the map comes together</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepBody}>
                <h3>Fetch public orbital data</h3>
                <p>OrbitMap pulls current TLE sets from CelesTrak&apos;s public catalog.</p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepBody}>
                <h3>Calculate live positions</h3>
                <p>
                  Using SGP4/SDP4 propagation, each satellite&apos;s position is recalculated
                  continuously as time passes.
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepBody}>
                <h3>Render it in real time</h3>
                <p>
                  A 3D globe, 2D map, and sky-dome view are rendered directly in your browser, so
                  you can rotate, zoom, and follow any object.
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepBody}>
                <h3>Answer your question</h3>
                <p>
                  Quick-action tools translate that raw orbital data into plain answers: what&apos;s
                  overhead, where you are relative to it, and when it&apos;ll next be visible.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.noticeCard}>
            <h2 className={styles.noticeTitle}>A note on accuracy</h2>
            <p className={styles.noticeText}>
              OrbitMap is built for education and curiosity, not for navigation, aviation,
              spaceflight operations, or any safety-critical decision. Public TLE data can be
              delayed, approximate, or occasionally out of date, and predicted visibility passes
              are estimates. For anything where accuracy genuinely matters, please consult an
              authoritative operational source. Full details are in our{" "}
              <Link href="/terms">Terms of Service</Link>.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Keep exploring</h2>
          <p className={styles.sectionText}>
            The best way to understand OrbitMap is to open it and watch something move. Jump into
            the live tracker, or reach out if you have questions, feedback, or ideas.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/app" className={styles.ctaPrimary}>
              Launch the App
            </Link>
            <Link href="/blog" className={styles.ctaSecondary}>
              Read the Blog
            </Link>
          </div>
        </section>

        <p className={styles.footNote}>
          Satellite names, imagery, and associated trademarks referenced on this site belong to
          their respective owners and are used for identification purposes only. See our{" "}
          <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>{" "}
          for more.
        </p>
      </div>
    </div>
  );
}
