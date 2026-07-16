// lib/blog/render-content.ts
//
// Converts a post's Markdown `content` field into safe, styled HTML for the
// post detail page, and slots in up to 4 in-article images.
//
// Requires: npm install marked
//
// Author-facing conventions (all optional, all just written straight into
// the Markdown `content` field in Supabase):
//
// 1. Standard Markdown — #/##/### headings, **bold**, lists, links, tables,
//    images — all convert automatically.
//
// 2. Image placement — drop `{{IMAGE_2}}`, `{{IMAGE_3}}`, `{{IMAGE_4}}`, or
//    `{{IMAGE_5}}` anywhere in the content and it'll be replaced with the
//    matching image column. If you don't add a placeholder but the column
//    has a value, it's auto-inserted after a sensible paragraph so it's
//    never silently dropped.
//
// 3. Key Takeaway / Quick Answer box — paste this block directly in content:
//    <div class="tldr-box">
//    <p><strong>Quick answer:</strong> ...</p>
//    <ul><li>...</li><li>...</li></ul>
//    </div>
//
// 4. Pull-quote / callout — same idea:
//    <div class="callout-box"><p>...</p></div>
//
// 5. Call-to-action banner — paste this at the end of a post (or anywhere).
//    If a post doesn't include one, a default site-wide CTA is appended
//    automatically so every post ends with one:
//    <div class="cta-box">
//    <h3>Heading</h3>
//    <p>Short supporting line.</p>
//    <a href="/app" class="cta-btn">Button label →</a>
//    </div>
//
// 6. Interactive widget placeholder — reserves a slot a client component
//    can hydrate into later (e.g. a calculator):
//    <div class="widget-placeholder" data-widget="next-pass-calculator"></div>

import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false,
})

export interface PostImageFields {
  image_url_2?: string | null
  image_url_3?: string | null
  image_url_4?: string | null
  image_url_5?: string | null
  image_alt_2?: string | null
  image_alt_3?: string | null
  image_alt_4?: string | null
  image_alt_5?: string | null
}

const DEFAULT_CTA_HTML = `
<div class="cta-box">
  <h3>See it live, right now</h3>
  <p>Launch the interactive 3D tracker and watch real satellites orbit Earth in real time.</p>
  <a href="/app" class="cta-btn">Launch the Tracker →</a>
</div>
`

function buildFigure(url: string, alt: string) {
  return `\n<figure><img class="post-img" src="${url}" alt="${escapeAttr(alt)}" loading="lazy" /></figure>\n`
}

function escapeAttr(value: string) {
  return value.replace(/"/g, '&quot;')
}

// Inserts html after the Nth closing </p>; appends to the end if the post
// doesn't have that many paragraphs, so an image is never silently dropped.
function insertAfterParagraph(html: string, insertHtml: string, paragraphIndex: number) {
  const closeTag = '</p>'
  let count = 0
  let searchFrom = 0
  while (count < paragraphIndex) {
    const idx = html.indexOf(closeTag, searchFrom)
    if (idx === -1) return html + insertHtml
    searchFrom = idx + closeTag.length
    count++
  }
  return html.slice(0, searchFrom) + insertHtml + html.slice(searchFrom)
}

// Wraps every <table> in a scrollable container so wide tables don't break
// mobile layout, without needing extra author markup.
function wrapTables(html: string) {
  return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>')
}

export function renderBlogContent(rawContent: string, title: string, images: PostImageFields): string {
  let html = marked.parse(rawContent || '', { async: false }) as string
  html = wrapTables(html)

  const slots: Array<{
    n: 2 | 3 | 4 | 5
    url?: string | null
    alt?: string | null
    fallbackParagraph: number
  }> = [
    { n: 2, url: images.image_url_2, alt: images.image_alt_2, fallbackParagraph: 2 },
    { n: 3, url: images.image_url_3, alt: images.image_alt_3, fallbackParagraph: 4 },
    { n: 4, url: images.image_url_4, alt: images.image_alt_4, fallbackParagraph: 6 },
    { n: 5, url: images.image_url_5, alt: images.image_alt_5, fallbackParagraph: 8 },
  ]

  for (const slot of slots) {
    const placeholder = `{{IMAGE_${slot.n}}}`
    if (slot.url) {
      const figure = buildFigure(slot.url, slot.alt || title)
      html = html.includes(placeholder)
        ? html.replaceAll(placeholder, figure)
        : insertAfterParagraph(html, figure, slot.fallbackParagraph)
    } else {
      html = html.replaceAll(placeholder, '')
    }
  }

  const hasCustomCta = html.includes('class="cta-box"') || html.includes("class='cta-box'")
  if (!hasCustomCta) {
    html += DEFAULT_CTA_HTML
  }

  return html
}

// Rough reading-time estimate from the raw Markdown (good enough for a
// "X min read" badge without pulling in a full text-stats dependency).
export function estimateReadingTime(rawContent: string): number {
  const words = (rawContent || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
