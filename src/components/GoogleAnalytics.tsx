import Script from "next/script";

const GA_MEASUREMENT_ID = "G-W4E3C6C894";

/**
 * Google Analytics (GA4). Loaded with `afterInteractive` so it downloads
 * and runs after the page's own content, never competing with first paint
 * or blocking render — keeps the Performance work done elsewhere intact.
 */
export default function GoogleAnalytics() {
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
