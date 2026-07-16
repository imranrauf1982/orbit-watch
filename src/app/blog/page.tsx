import Link from "next/link";
import type { Metadata } from "next";
import styles from "./Blog.module.css";

export const metadata: Metadata = {
  title: "Blog — OrbitMap",
  description:
    "Guides and explainers on satellite tracking, orbital data, and how to spot the ISS — straight from the team behind OrbitMap.",
};

const POSTS = [
  {
    slug: "how-tle-data-works",
    tag: "Explainer",
    title: "How TLE Data Works: The Numbers Behind Every Satellite's Position",
    excerpt:
      "Every satellite on OrbitMap is powered by two dense lines of text. Here's what a TLE actually contains, and how software turns it into a live position.",
    date: "Jul 2026",
    readTime: "6 min read",
    live: true,
  },
  {
    slug: "best-times-to-spot-the-iss",
    tag: "Guide",
    title: "The Best Times to Spot the ISS With Your Own Eyes",
    excerpt:
      "You don't need a telescope to see the International Space Station. Here's how visible passes work and how to plan one from your location.",
    date: "Coming soon",
    readTime: "5 min read",
    live: false,
  },
  {
    slug: "orbital-decay-explained",
    tag: "Explainer",
    title: "Why Satellites Slowly Fall: Orbital Decay Explained",
    excerpt:
      "Low-Earth-orbit satellites are always losing altitude, just very slowly. We break down atmospheric drag and why old satellites eventually burn up.",
    date: "Coming soon",
    readTime: "7 min read",
    live: false,
  },
  {
    slug: "starlink-vs-traditional-satellites",
    tag: "Deep Dive",
    title: "Starlink vs. Traditional Satellites: Why There Are So Many Dots Now",
    excerpt:
      "Megaconstellations have changed what it means to track satellites. Here's how Starlink's approach differs from a classic single geostationary satellite.",
    date: "Coming soon",
    readTime: "8 min read",
    live: false,
  },
];

export default function BlogIndexPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Back to home
        </Link>

        <span className={styles.kicker}>OrbitMap Blog</span>
        <h1 className={styles.title}>Notes from orbit</h1>
        <p className={styles.lead}>
          Explainers, guides, and deep dives on satellite tracking, orbital mechanics, and how to
          make sense of the data behind the map — written for curious readers, not just engineers.
        </p>

        <div className={styles.grid}>
          {POSTS.map((post) =>
            post.live ? (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.postCard}>
                <span className={styles.postTag}>{post.tag}</span>
                <h2 className={styles.postTitle}>{post.title}</h2>
                <p className={styles.postExcerpt}>{post.excerpt}</p>
                <div className={styles.postMeta}>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </Link>
            ) : (
              <div key={post.slug} className={styles.postCard} aria-disabled>
                <span className={styles.postTag}>{post.tag}</span>
                <h2 className={styles.postTitle}>{post.title}</h2>
                <p className={styles.postExcerpt}>{post.excerpt}</p>
                <div className={styles.postMeta}>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            )
          )}
        </div>

        <p className={styles.comingSoonCard}>
          More posts are on the way. Have a topic you&apos;d like explained? Reach out from the{" "}
          <Link href="/" style={{ color: "var(--cyan-soft)", textDecoration: "underline" }}>
            home page
          </Link>{" "}
          contact form.
        </p>
      </div>
    </div>
  );
}
