import { createClient } from "@supabase/supabase-js";

// Public, read-only Supabase client used by blog pages (Server Components).
// Uses the anon/publishable key — safe here because Row Level Security on
// the `blogs` table only allows reading rows where is_live = true.
// For any future admin/editor tooling that needs to write posts, use
// src/lib/supabase-admin.ts (service_role key) instead — never this one.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
