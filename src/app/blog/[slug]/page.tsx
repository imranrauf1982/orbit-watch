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

  // Build the extra in-post images (2nd and 3rd) from Supabase data.
  // Preferred: editors drop {{IMAGE_2}} / {{IMAGE_3}} anywhere inside `content`.
  // Fallback: if no placeholder is found in the content, the image is still
  // inserted automatically at a sensible spot so it's never silently dropped.
  let renderedContent = post.content || '<p>No content available.</p>'

  const buildFigure = (url: string, alt: string) => `
    <figure>
      <img class="post-img" src="${url}" alt="${alt}" />
    </figure>
  `

  // Inserts figureHtml after the Nth closing </p> tag; if the content doesn't
  // have that many paragraphs, appends it to the end instead.
  const insertAfterParagraph = (html: string, figureHtml: string, paragraphIndex: number) => {
    const closeTag = '</p>'
    let count = 0
    let searchFrom = 0
    while (count < paragraphIndex) {
      const idx = html.indexOf(closeTag, searchFrom)
      if (idx === -1) {
        // Not enough paragraphs — just append at the end.
        return html + figureHtml
      }
      searchFrom = idx + closeTag.length
      count++
    }
    return html.slice(0, searchFrom) + figureHtml + html.slice(searchFrom)
  }

  if (post.image_url_2) {
    const figure2 = buildFigure(post.image_url_2, post.title)
    renderedContent = renderedContent.includes('{{IMAGE_2}}')
      ? renderedContent.replaceAll('{{IMAGE_2}}', figure2)
      : insertAfterParagraph(renderedContent, figure2, 2)
  } else {
    renderedContent = renderedContent.replaceAll('{{IMAGE_2}}', '')
  }

  if (post.image_url_3) {
    const figure3 = buildFigure(post.image_url_3, post.title)
    renderedContent = renderedContent.includes('{{IMAGE_3}}')
      ? renderedContent.replaceAll('{{IMAGE_3}}', figure3)
      : insertAfterParagraph(renderedContent, figure3, 4)
  } else {
    renderedContent = renderedContent.replaceAll('{{IMAGE_3}}', '')
  }

  return (
    <main className="min-h-screen pt-20 pb-20 px-4 bg-[#05070c]">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <div className="mb-10">
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

        <div className="mt-10">
          <Link href="/blog" className="text-[#8fe7f2] font-medium">
            ← Back to Blog
          </Link>
        </div>
      </div>
    </main>
  )
}
