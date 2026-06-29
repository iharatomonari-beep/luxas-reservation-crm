-- LUXAS フェーズA 設定系スライス（その1）: EPARK設定 epark_settings（テナント1行・JSONB単一行）
-- 適用順: schema.sql → rls.sql → 最小シード → 各 phase3-*.sql → このファイル。
-- 冪等（再実行安全）。singleton 設定（useLocalCollection でない）。store-settings は次スライスで（公開RPC込み）。
-- ★方針: 個別項目は settings(jsonb) 内に持つため、DB列のNULL問題は発生しない。seed なし（初回保存で行作成）。

-- ============================================================
-- epark_settings（テナント共通・1テナント1行）
-- ============================================================
create table if not exists public.epark_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,   -- {recommendedCourse1Id, recommendedCourse2Id}（コースは legacy ID保持）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- 1テナント1行（upsert の突き合わせキー）
create unique index if not exists uq_epark_settings_tenant on public.epark_settings(tenant_id);
drop trigger if exists trg_epark_settings_updated_at on public.epark_settings;
create trigger trg_epark_settings_updated_at before update on public.epark_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS（テナント単位: 参照=スタッフ全員 / 変更=owner・manager）
-- ============================================================
alter table public.epark_settings enable row level security;
drop policy if exists epark_settings_select on public.epark_settings;
create policy epark_settings_select on public.epark_settings for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists epark_settings_write on public.epark_settings;
create policy epark_settings_write on public.epark_settings for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );
