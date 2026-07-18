import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  short_description: string;
  description: string;
  image_url: string;
  gallery_urls: string[];
  price_cents: number;
  original_price_cents: number | null;
  currency: string;
  affiliate_url: string;
  rating: number;
  rating_count: number;
  is_featured: boolean;
  is_new: boolean;
};

export const revalidate = 0;

async function getProduct(slug: string): Promise<ProductDetail | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, brand, category, short_description, description, image_url, gallery_urls, price_cents, original_price_cents, currency, affiliate_url, rating, rating_count, is_featured, is_new"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Supabase error loading product:", error.message);
    return null;
  }
  return data as ProductDetail | null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product — OrbitMap" };
  return {
    title: `${product.name} — OrbitMap`,
    description: product.short_description,
  };
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-2">
      <div className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill={i < full ? "#FFB84D" : "none"}
            stroke="#FFB84D"
            strokeWidth="1"
          >
            <path d="M10 1.5l2.6 5.3 5.8.85-4.2 4.1 1 5.75L10 14.7l-5.2 2.8 1-5.75-4.2-4.1 5.8-.85L10 1.5Z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-muted">
        {rating.toFixed(1)} · {count.toLocaleString()} ratings
      </span>
    </div>
  );
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const images = [product.image_url, ...(product.gallery_urls ?? [])];
  const hasDiscount =
    product.original_price_cents != null && product.original_price_cents > product.price_cents;
  const discountPct = hasDiscount
    ? Math.round(
        ((((product.original_price_cents as number) - product.price_cents) /
          (product.original_price_cents as number)) *
          100)
      )
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Link href="/products" className="text-sm text-muted transition-colors hover:text-ink">
        ← Back to products
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Image gallery */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white">
            <Image
              src={images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-8"
              priority
            />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {product.is_featured && (
                <span className="rounded-full bg-signal px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-void">
                  Featured
                </span>
              )}
              {product.is_new && (
                <span className="rounded-full bg-orbit px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-void">
                  New
                </span>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white"
                >
                  <Image src={src} alt={`${product.name} ${i + 2}`} fill sizes="120px" className="object-contain p-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.brand && (
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {product.brand}
            </span>
          )}
          <h1 className="mt-1.5 font-display text-2xl font-bold text-ink sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3">
            <StarRating rating={product.rating} count={product.rating_count} />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-ink">
              {formatPrice(product.price_cents, product.currency)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-muted line-through">
                  {formatPrice(product.original_price_cents as number, product.currency)}
                </span>
                <span className="rounded-full bg-signal/15 px-2.5 py-1 text-xs font-semibold text-signal">
                  -{discountPct}%
                </span>
              </>
            )}
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">{product.short_description}</p>

          <a
            href={product.affiliate_url}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-signal px-6 py-3.5 text-sm font-semibold text-void transition-transform hover:scale-[1.01] active:scale-[0.98] sm:w-auto sm:px-10"
          >
            View Deal
          </a>

          <div className="mt-10 border-t border-white/10 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              About this product
            </h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink/90">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
