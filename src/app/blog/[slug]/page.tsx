// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { renderBlogContent, estimateReadingTime } from '@/lib/render-content'

export const revalidate = 0

export async function generateStaticParams() {
  const { data: posts } = await supabase.from('blogs').select('slug').eq('is_live', true)
  return posts?.map((post) => ({ slug: post.slug })) ?? []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await supabase
    .from('blogs')
    .select('title, excerpt, image_url, category, published_at, updated_at, author_name')
    .eq('slug', slug)
    .eq('is_live', true)
    .single()

  if (!post) return { title: 'Post Not Found' }

  const url = `https://orbitmap.space/blog/${slug}`
  const title = `${post.title} | OrbitMap Blog`
  const description = post.excerpt || ''

  return {
    title,
    description,
    keywords: [post.category, 'satellite tracking', 'orbitmap blog', 'ISS tracking'].filter(
      Boolean
    ) as string[],
    alternates: { canonical: url },
    authors: post.author_name ? [{ name: post.author_name }] : undefined,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'OrbitMap',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: post.author_name ? [post.author_name] : undefined,
      images: post.image_url
        ? [{ url: post.image_url, width: 1200, height: 630, alt: post.title }]
        : [{ url: 'https://orbitmap.space/og-blog.png', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [post.image_url || 'https://orbitmap.space/og-blog.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: post } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('is_live', true)
    .single()

  if (!post) notFound()

  const renderedContent = renderBlogContent(post.content || '', post.title, {
    image_url_2: post.image_url_2,
    image_url_3: post.image_url_3,
    image_url_4: post.image_url_4,
    image_url_5: post.image_url_5,
    image_alt_2: post.image_alt_2,
    image_alt_3: post.image_alt_3,
    image_alt_4: post.image_alt_4,
    image_alt_5: post.image_alt_5,
  })

  const readingMinutes = estimateReadingTime(post.content || '')
  const publishedDate = new Date(post.published_at)
  const url = `https://orbitmap.space/blog/${slug}`

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    image: post.image_url ? [post.image_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      '@type': 'Person',
      name: post.author_name || 'OrbitMap Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'OrbitMap',
      logo: {
        '@type': 'ImageObject',
        url: 'https://orbitmap.space/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://orbitmap.space/blog' },
      { '@type': 'ListItem', position: 2, name: post.title, item: url },
    ],
  }

  return (
    <main className="min-h-screen pt-20 pb-20 px-4 bg-[#05070c]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Constrained to max-w-3xl (~700px) for a comfortable line length */}
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/blog" className="text-[#8fe7f2] text-sm font-semibold inline-flex items-center gap-1">
            ← Back to Blog
          </Link>
        </div>

        {/* Category + meta */}
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <span className="bg-[#4fd8eb]/10 text-[#8fe7f2] text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
            {post.category || 'Satellite Tracking'}
          </span>
          <span className="text-gray-500 text-[12px]">
            {post.author_name || 'OrbitMap Team'} ·{' '}
            {publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} ·{' '}
            {readingMinutes} min read
          </span>
        </div>

        {/* H1 — Post Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-8">{post.title}</h1>

        {/* Hero / Cover Image (image_url) */}
        {post.image_url && (
          <div className="relative w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-10 bg-[#0a0e18]">
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* White Content Card */}
        <div className="bg-white rounded-3xl p-8 md:p-16 shadow-2xl">
          <div
            className="
            prose prose-lg max-w-none text-gray-700
            [&_h1]:text-gray-900 [&_h1]:text-3xl [&_h1]:md:text-4xl [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-6
            [&_h2]:text-gray-900 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4
            [&_h3]:text-gray-900 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2
            [&_h4]:text-gray-900 [&_strong]:text-gray-900 [&_b]:text-gray-900 [&_a]:text-[#0aa8c2] [&_a]:font-medium
            [&_p]:leading-[1.75] [&_p]:mb-6 [&_p]:text-[16px]

            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-6 [&_ul]:space-y-2
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-6 [&_ol]:space-y-2
            [&_li]:leading-[1.75]

            [&_.cta-btn]:inline-block [&_.cta-btn]:no-underline [&_.cta-btn]:bg-gradient-to-b [&_.cta-btn]:from-[#eaf9fc] [&_.cta-btn]:to-[#c6ecf3] [&_.cta-btn]:text-[#05141a] [&_.cta-btn]:font-bold [&_.cta-btn]:px-6 [&_.cta-btn]:py-3 [&_.cta-btn]:rounded-full [&_.cta-btn]:my-2 [&_.cta-btn]:mr-3 [&_.cta-btn]:shadow-lg [&_.cta-btn]:hover:opacity-90 [&_.cta-btn]:transition-opacity

            [&_.tldr-box]:bg-[#4fd8eb]/5 [&_.tldr-box]:border [&_.tldr-box]:border-[#4fd8eb]/20 [&_.tldr-box]:border-l-4 [&_.tldr-box]:border-l-[#0aa8c2] [&_.tldr-box]:rounded-2xl [&_.tldr-box]:p-6 [&_.tldr-box]:my-8 [&_.tldr-box_p]:m-0 [&_.tldr-box_p]:mb-2 [&_.tldr-box_ul]:m-0 [&_.tldr-box_ul]:mt-2

            [&_.callout-box]:bg-gray-50 [&_.callout-box]:border-l-4 [&_.callout-box]:border-[#0aa8c2] [&_.callout-box]:rounded-r-xl [&_.callout-box]:p-6 [&_.callout-box]:my-8 [&_.callout-box]:italic [&_.callout-box]:text-gray-800 [&_.callout-box]:text-lg [&_.callout-box_p]:m-0

            [&_.cta-box]:bg-gradient-to-br [&_.cta-box]:from-[#0d1420] [&_.cta-box]:to-[#0a0e18] [&_.cta-box]:rounded-3xl [&_.cta-box]:p-8 [&_.cta-box]:my-12 [&_.cta-box]:text-center [&_.cta-box_h3]:text-white [&_.cta-box_h3]:text-xl [&_.cta-box_h3]:font-bold [&_.cta-box_h3]:mt-0 [&_.cta-box_h3]:mb-2 [&_.cta-box_p]:text-gray-300 [&_.cta-box_p]:mb-5 [&_.cta-box_p]:mt-0

            [&_.widget-placeholder]:border-2 [&_.widget-placeholder]:border-dashed [&_.widget-placeholder]:border-gray-300 [&_.widget-placeholder]:rounded-2xl [&_.widget-placeholder]:p-10 [&_.widget-placeholder]:my-8 [&_.widget-placeholder]:text-center [&_.widget-placeholder]:text-gray-400 [&_.widget-placeholder]:text-sm [&_.widget-placeholder]:bg-gray-50

            [&_.post-img]:rounded-2xl [&_.post-img]:shadow-md [&_.post-img]:my-8 [&_.post-img]:w-full [&_.post-img]:h-auto
            [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-gray-500 [&_figcaption]:mt-[-1.5rem] [&_figcaption]:mb-8

            [&_.table-wrap]:overflow-x-auto [&_.table-wrap]:my-8 [&_.table-wrap]:rounded-xl [&_.table-wrap]:border [&_.table-wrap]:border-gray-200
            [&_table]:w-full [&_table]:border-collapse [&_table]:min-w-[560px] [&_table]:my-0
            [&_th]:bg-gray-100 [&_th]:text-gray-900 [&_th]:font-bold [&_th]:p-3 [&_th]:text-left [&_th]:border [&_th]:border-gray-200
            [&_td]:p-3 [&_td]:border [&_td]:border-gray-200
            [&_tbody_tr:nth-child(even)]:bg-gray-50
          "
            style={{ fontFamily: 'Georgia, serif' }}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        </div>

        <div className="mt-10">
          <Link href="/blog" className="text-[#8fe7f2] font-medium">
            ← Back to Blog
          </Link>
        </div>
      </div>
    </main>
  )
}

/*
Notes for whoever wires this up:

1. Install the markdown parser this page depends on:
     npm install marked

2. Run db/2026_07_blog_images_migration.sql against Supabase before
   deploying — it only adds image_url_4 / image_url_5 (+ optional alt-text
   columns), nothing existing is touched.

3. Nothing about /blog (the listing page) needs to change for this — it
   already only reads image_url, title, excerpt, category, etc., which are
   untouched.

4. Widget placeholders (`<div class="widget-placeholder" data-widget="...">`)
   render as a dashed "reserved" box for now. To make one interactive, add a
   small "use client" component that runs on mount, queries
   `article [data-widget]`, and portals/renders the matching React widget
   into it (e.g. with `ReactDOM.createPortal` or `createRoot`). Nothing here
   blocks doing that later — the placeholder markup and styling are already
   in place.
*/
