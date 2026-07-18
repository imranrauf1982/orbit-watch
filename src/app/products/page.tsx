import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import ProductsClient, { type Product } from "@/components/ProductsClient";

export const metadata: Metadata = {
  title: "Products — OrbitMap",
  description:
    "Space, satellite, and stargazing gear — telescopes, tracking hardware, software, and subscriptions picked for OrbitMap readers.",
};

export const revalidate = 0;

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, brand, category, short_description, image_url, price_cents, original_price_cents, currency, rating, rating_count, is_featured, is_new, sort_weight, created_at"
    )
    .eq("is_active", true);

  if (error) {
    console.error("Supabase error loading products:", error.message);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orbit">
          Gear &amp; Tools
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
          Space &amp; satellite products we recommend
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Telescopes, tracking hardware, software, and subscriptions for watching the sky —
          picked to pair with OrbitMap.
        </p>
      </div>

      <div className="mt-10">
        <ProductsClient products={(products as Product[]) ?? []} />
      </div>

      <p className="mt-14 max-w-2xl text-xs leading-relaxed text-muted">
        Some links on this page are affiliate links. If you buy something through them, OrbitMap
        may earn a commission at no extra cost to you — this helps keep the live tracker free.
      </p>
    </div>
  );
}
