export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  };
}

export function isSupabaseConfigured() {
  const { anonKey, url } = getSupabaseConfig();

  return Boolean(url && anonKey);
}
