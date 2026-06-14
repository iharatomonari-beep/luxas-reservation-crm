import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const { anonKey, url } = getSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createBrowserClient(url, anonKey);
}
