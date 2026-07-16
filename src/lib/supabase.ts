import { createClient } from "@supabase/supabase-js";

// Client-side Supabase connection — safe to use in "use client" components.
// Uses the public URL + anon key only. Row Level Security (RLS) policies
// in Supabase are what actually protect your data when using this client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
