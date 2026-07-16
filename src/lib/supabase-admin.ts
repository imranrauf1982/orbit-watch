import { createClient } from "@supabase/supabase-js";

// Server-only Supabase connection — uses the service_role key, which
// bypasses Row Level Security. NEVER import this file into a "use client"
// component or any code that ships to the browser. Only use it inside
// Route Handlers (src/app/api/**/route.ts) or Server Components.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});
