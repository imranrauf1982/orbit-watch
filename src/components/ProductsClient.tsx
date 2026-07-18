"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  short_description: string;
  image_url: string;
  price_cents: number;
  original_price_cents: number | null;
  currency: string;
  rating: number;
  rating_count: number;
  is_featured: boolean;
  is_new: boolean;
  sort_weight: number;
  created_at: string;
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gadgets", label: "Gadgets" },
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "subscription", label: "Subscriptions" },
  { value: "service", label: "Services" },
  { value: "books_media", label: "Books & Media" },
  { value: "other", label: "Other" },
];

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

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
    <div className="flex items-center gap-1.5">
      <div className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            width="13"
            height="13"
            fill={i < full ? "#FFB84D" : "none"}
            stroke="#FFB84D"
            strokeWidth="1"
          >
            <path d="M10 1.5l2.6 5.3 5.8.85-4.2 4.1 1 5.75L10 14.7l-5.2 2.8 1-5.75-4.2-4.1 5.8-.85L10 1.5Z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-muted">
        {rating.toFixed(1)} ({count.toLocaleString()})
      </span>
    </div>
  );
}

function PriceBlock({ product }: { product: Product }) {
  const hasDiscount =
    product.original_price_cents != null && product.original_price_cents > product.price_cents;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-bold text-ink">
        {formatPrice(product.price_cents, product.currency)}
      </span>
      {hasDiscount && (
        <span className="text-xs text-muted line-through">
          {formatPrice(product.original_price_cents as number, product.currency)}
        </span>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-orbit/40"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
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

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {product.brand}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
          {product.name}
        </h3>
        <StarRating rating={product.rating} count={product.rating_count} />
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">
          {product.short_description}
        </p>
        <div className="mt-auto pt-2">
          <PriceBlock product={product} />
        </div>
      </div>
    </Link>
  );
}

export default function ProductsClient({ products }: { products: Product[] }) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortValue>("featured");

  const featured = useMemo(
    () =>
      products
        .filter((p) => p.is_featured && (category === "all" || p.category === category))
        .sort((a, b) => b.sort_weight - a.sort_weight)
        .slice(0, 4),
    [products, category]
  );

  const filteredSorted = useMemo(() => {
    const filtered = products.filter((p) => category === "all" || p.category === category);

    const sorted = [...filtered];
    switch (sort) {
      case "price_asc":
        sorted.sort((a, b) => a.price_cents - b.price_cents);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.price_cents - a.price_cents);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating || b.rating_count - a.rating_count);
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "featured":
      default:
        sorted.sort(
          (a, b) =>
            Number(b.is_featured) - Number(a.is_featured) ||
            b.sort_weight - a.sort_weight ||
            b.rating - a.rating
        );
        break;
    }
    return sorted;
  }, [products, category, sort]);

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              category === c.value
                ? "border-orbit bg-orbit/10 text-orbit"
                : "border-white/10 bg-white/[0.03] text-muted hover:text-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort control */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {filteredSorted.length} {filteredSorted.length === 1 ? "product" : "products"}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-orbit"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-void text-ink">
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Featured shelf */}
      {featured.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Featured picks
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-8 border-t border-white/5" />
        </div>
      )}

      {/* Main grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredSorted.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {filteredSorted.length === 0 && (
        <div className="mt-16 text-center text-sm text-muted">
          No products in this category yet — check back soon.
        </div>
      )}
    </div>
  );
}
