import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics (GA4). Loaded with `afterInteractive` so it downloads
 * and runs after the page's own content, never competing with first paint
 * or blocking render — keeps the Performance work done elsewhere intact.
 *
 * Reads the measurement ID from NEXT_PUBLIC_GA_MEASUREMENT_ID so forks/clones
 * of this repo don't silently report traffic into the original owner's GA
 * property. Renders nothing if the env var isn't set.
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
