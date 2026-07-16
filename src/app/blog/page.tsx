import Link from "next/link";
import type { Metadata } from "next";
import styles from "../Placeholder.module.css";

export const metadata: Metadata = {
  title: "Blog — OrbitMap",
  description: "Notes on orbital mechanics, satellite tracking, and what's new on OrbitMap.",
};

export default function BlogPage() {
  return (
    <div className={styles.page}>
      <span className={styles.kicker}>Blog</span>
      <h1 className={styles.title}>Posts are on their way</h1>
      <p className={styles.text}>
        We&apos;re gathering notes on orbital mechanics, pass predictions, and what&apos;s new on
        OrbitMap. Check back soon.
      </p>
      <Link href="/" className={styles.back}>
        Back to Home
      </Link>
    </div>
  );
}
