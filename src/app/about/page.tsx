import Link from "next/link";
import type { Metadata } from "next";
import styles from "../Placeholder.module.css";

export const metadata: Metadata = {
  title: "About — OrbitMap",
  description: "The story behind OrbitMap's live satellite and ISS tracker.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <span className={styles.kicker}>About</span>
      <h1 className={styles.title}>The OrbitMap story is being written</h1>
      <p className={styles.text}>
        We&apos;re putting this page together. In the meantime, jump into the live 3D orbital map
        and see what&apos;s overhead right now.
      </p>
      <Link href="/app" className={styles.back}>
        Launch App
      </Link>
    </div>
  );
}
