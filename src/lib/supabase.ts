import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Offline-first: allow app to run without env configured.
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Sync will be unavailable until configured.",
  );
}

// Still create the client so imports are stable even offline.
// NOTE: createClient() requires a valid URL; use a harmless placeholder when missing.
export const supabase = createClient(
  supabaseUrl ?? "http://localhost",
  supabaseAnonKey ?? "missing-anon-key",
);
