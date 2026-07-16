import Link from "next/link";
import type { Metadata } from "next";
import styles from "../Placeholder.module.css";

export const metadata: Metadata = {
  title: "Products — OrbitMap",
  description: "What's next for OrbitMap.",
};

export default function ProductsPage() {
  return (
    <div className={styles.page}>
      <span className={styles.kicker}>Products</span>
      <h1 className={styles.title}>More ways to track the sky, coming soon</h1>
      <p className={styles.text}>
        We&apos;re working on new tools beyond the live orbital map. Want to hear about them
        first? Reach out at{" "}
        <a href="mailto:info@orbitmap.space" style={{ color: "#8fe7f2" }}>
          info@orbitmap.space
        </a>
        .
      </p>
      <Link href="/app" className={styles.back}>
        Launch App
      </Link>
    </div>
  );
}
