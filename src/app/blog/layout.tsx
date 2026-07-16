// app/blog/layout.tsx
import type { Metadata } from 'next'

// Base metadata inherited by all /blog/* pages (overridden per-page as needed)
export const metadata: Metadata = {
  metadataBase: new URL('https://orbitmap.space'),
  alternates: { canonical: 'https://orbitmap.space/blog' },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
