import Link from "next/link";
import type { Metadata } from "next";
import styles from "../Placeholder.module.css";

export const metadata: Metadata = {
  title: "Account — OrbitMap",
};

export default function AccountPage() {
  return (
    <div className={styles.page}>
      <span className={styles.kicker}>Account</span>
      <h1 className={styles.title}>Accounts aren&apos;t open yet</h1>
      <p className={styles.text}>
        OrbitMap doesn&apos;t require sign-in today — everything runs right in your browser. This
        is where account features will live once they launch.
      </p>
      <Link href="/" className={styles.back}>
        Back to Home
      </Link>
    </div>
  );
}
