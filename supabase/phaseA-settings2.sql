-- LUXAS フェーズA 設定系（その2）: 店舗設定 store_settings（店舗ごと1行・JSONB単一行）＋公開RPC
-- 適用順: schema.sql → rls.sql → 最小シード → 各 phase3-*.sql → phaseA-settings.sql → このファイル。
-- 冪等（再実行安全）。singleton 設定。seedなし（初回保存で行作成）。
-- ★公開RPCは settings を丸ごと返さず、ホワイトリストのキーのみ jsonb_build_object で組み立てて返す（機微は構造上出力されない）。

-- ============================================================
-- 1. store_settings（店舗ごと1行）
-- ============================================================
create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,   -- StoreSettings 丸ごと（個別項目は jsonb 内）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- 1店舗1行（upsert の突き合わせキー）
create unique index if not exists uq_store_settings_store on public.store_settings(store_id);
create index if not exists idx_store_settings_tenant on public.store_settings(tenant_id);
drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. RLS（店舗単位: 参照=自店舗スタッフ / 変更=owner・manager）
--    ※生テーブルは authenticated のみ。公開ページ(anon)は下の公開RPC経由でのみ安全項目を取得。
-- ============================================================
alter table public.store_settings enable row level security;
drop policy if exists store_settings_select on public.store_settings;
create policy store_settings_select on public.store_settings for select to authenticated
  using ( store_id in (select public.app_user_store_ids()) );
drop policy if exists store_settings_write on public.store_settings;
create policy store_settings_write on public.store_settings for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) and public.app_has_role(array['owner','manager']) )
  with check ( store_id in (select public.app_user_store_ids()) and public.app_has_role(array['owner','manager']) );

-- ============================================================
-- 3. 公開RPC get_store_public_settings(store code)
--    anon/authenticated 実行可。store code で stores→store_settings を解決し、
--    ★ホワイトリストのキーのみを返す（機微フィールドは一切含めない）。
-- ============================================================
create or replace function public.get_store_public_settings(p_store_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'businessStartTime',          ss.settings->>'businessStartTime',
    'businessEndTime',            ss.settings->>'businessEndTime',
    'reservationAcceptStartTime', ss.settings->>'reservationAcceptStartTime',
    'reservationAcceptEndTime',   ss.settings->>'reservationAcceptEndTime',
    'slotMinutes',                (ss.settings->>'slotMinutes')::int,
    'onlineReservationEnabled',   (ss.settings->>'onlineReservationEnabled')::boolean,
    'hpDescription',              ss.settings->>'hpDescription',
    'hpImageUrl',                 ss.settings->>'hpImageUrl',
    'hpBusinessHoursText',        ss.settings->>'hpBusinessHoursText',
    'hpClosedDaysText',           ss.settings->>'hpClosedDaysText',
    'hpUrl',                      ss.settings->>'hpUrl',
    'themeColor',                 ss.settings->>'themeColor',
    'storeName',                  ss.settings->>'storeName',
    'storeShortName',             ss.settings->>'storeShortName',
    'postalCode',                 ss.settings->>'postalCode',
    'prefecture',                 ss.settings->>'prefecture',
    'city',                       ss.settings->>'city',
    'address2',                   ss.settings->>'address2',
    'phone',                      ss.settings->>'phone'
  )
  from public.stores st
  join public.store_settings ss on ss.store_id = st.id
  where st.code = p_store_code and st.is_active
  limit 1
$$;

revoke all on function public.get_store_public_settings(text) from public;
grant execute on function public.get_store_public_settings(text) to anon, authenticated;
