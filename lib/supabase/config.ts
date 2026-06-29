export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    // 旧方式 anon key（JWT）と新方式 publishable key（sb_publishable_…）の両方に対応。
    // ANON_KEY が無ければ PUBLISHABLE_KEY を読む（後方互換＋新キー方式への前方互換）。
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      ""
  };
}

export function isSupabaseConfigured() {
  const { anonKey, url } = getSupabaseConfig();

  return Boolean(url && anonKey);
}
