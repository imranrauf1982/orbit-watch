import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — OrbitMap",
  description:
    "Get in touch with OrbitMap for affiliate partnerships, sponsorships, product listings, or general questions and feedback.",
};

const CONTACT_EMAIL = "info@orbitmap.space";

export default function ContactPage() {
  return (
    <div className="relative">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
          ← Back to home
        </Link>

        <div className="mt-6 max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orbit">
            Get in touch
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
            Contact OrbitMap
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Interested in an affiliate partnership, sponsoring OrbitMap, or listing a
            space-related product or service on the site? Or just have a question or
            suggestion? Send us a message below, or email us directly.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-orbit/40 hover:text-orbit"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
              <path
                d="M3.5 6.5h17v11h-17v-11Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <ContactForm />
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted">
          We typically reply within a few business days. For partnership and sponsorship
          inquiries, including a link to your product or service helps us respond faster.
        </p>
      </div>
    </div>
  );
}
