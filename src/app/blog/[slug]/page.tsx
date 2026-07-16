// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 0

export async function generateStaticParams() {
  const { data: posts } = await supabase.from('blogs').select('slug').eq('is_live', true)
  return posts?.map((post) => ({ slug: post.slug })) ?? []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await supabase
    .from('blogs')
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('is_live', true)
    .single()

  if (!post) return { title: 'Post Not Found' }

  return {
    title: `${post.title} | OrbitMap Blog`,
    description: post.excerpt || '',
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

  // Build the extra in-post images (2nd and 3rd) purely from Supabase data.
  // Editors just drop {{IMAGE_2}} / {{IMAGE_3}} anywhere inside `content`
  // in Supabase, and fill image_url_2 / image_url_3 — no code changes ever needed.
  let renderedContent = post.content || '<p>No content available.</p>'

  const buildFigure = (url: string, alt: string) => `
    <figure>
      <img class="post-img" src="${url}" alt="${alt}" />
    </figure>
  `

  if (post.image_url_2) {
    renderedContent = renderedContent.replaceAll(
      '{{IMAGE_2}}',
      buildFigure(post.image_url_2, post.title)
    )
  } else {
    renderedContent = renderedContent.replaceAll('{{IMAGE_2}}', '')
  }

  if (post.image_url_3) {
    renderedContent = renderedContent.replaceAll(
      '{{IMAGE_3}}',
      buildFigure(post.image_url_3, post.title)
    )
  } else {
    renderedContent = renderedContent.replaceAll('{{IMAGE_3}}', '')
  }

  return (
    <main className="min-h-screen pt-20 pb-20 px-4 bg-[#05070c]">
      <div className="max-w-3xl mx-auto">
        {/* Title & Meta */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="bg-[#4fd8eb]/10 text-[#8fe7f2] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              {post.category || 'Satellite Tracking'}
            </span>
            <span className="text-gray-500 text-[11px]">
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-gray-500 text-[11px]">
              {post.author_name || 'OrbitMap Team'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            {post.title}
          </h1>
        </div>

        {/* Featured Image */}
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
            className="prose prose-lg max-w-none text-gray-700 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_strong]:text-gray-900 [&_b]:text-gray-900 [&_a]:text-[#0aa8c2]
            [&_.cta-btn]:inline-block [&_.cta-btn]:no-underline [&_.cta-btn]:bg-gradient-to-b [&_.cta-btn]:from-[#eaf9fc] [&_.cta-btn]:to-[#c6ecf3] [&_.cta-btn]:text-[#05141a] [&_.cta-btn]:font-bold [&_.cta-btn]:px-6 [&_.cta-btn]:py-3 [&_.cta-btn]:rounded-full [&_.cta-btn]:my-2 [&_.cta-btn]:mr-3 [&_.cta-btn]:shadow-lg [&_.cta-btn]:hover:opacity-90 [&_.cta-btn]:transition-opacity
            [&_.tldr-box]:bg-[#4fd8eb]/5 [&_.tldr-box]:border [&_.tldr-box]:border-[#4fd8eb]/20 [&_.tldr-box]:rounded-2xl [&_.tldr-box]:p-6 [&_.tldr-box]:my-8 [&_.tldr-box_p]:m-0 [&_.tldr-box_ul]:m-0
            [&_.callout-box]:bg-gray-50 [&_.callout-box]:border-l-4 [&_.callout-box]:border-[#0aa8c2] [&_.callout-box]:rounded-r-xl [&_.callout-box]:p-6 [&_.callout-box]:my-8 [&_.callout-box]:italic [&_.callout-box]:text-gray-800 [&_.callout-box]:text-lg [&_.callout-box_p]:m-0
            [&_.post-img]:rounded-2xl [&_.post-img]:shadow-md [&_.post-img]:my-8 [&_.post-img]:w-full [&_.post-img]:h-auto
            [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-gray-500 [&_figcaption]:mt-[-1.5rem] [&_figcaption]:mb-8 [&_figcaption]:italic [&_figcaption]:not-italic
            [&_table]:w-full [&_table]:border-collapse [&_table]:my-8 [&_th]:bg-gray-100 [&_th]:text-gray-900 [&_th]:font-bold [&_th]:p-3 [&_th]:text-left [&_th]:border [&_th]:border-gray-200 [&_td]:p-3 [&_td]:border [&_td]:border-gray-200"
            style={{ fontFamily: 'Georgia, serif', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        </div>

        {/* Disclosure — affiliate/ad links may appear inside post content */}
        <p className="text-gray-500 text-xs mt-8 leading-relaxed">
          Some links in this article may be affiliate links, and this page may display ads. See
          our{' '}
          <Link href="/terms" className="text-[#8fe7f2] underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#8fe7f2] underline">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>

        <div className="mt-6">
          <Link href="/blog" className="text-[#8fe7f2] font-medium">
            ← Back to Blog
          </Link>
        </div>
      </div>
    </main>
  )
}
