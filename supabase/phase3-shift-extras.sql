-- LUXAS フェーズ3 第8スライス: シフトパターン(shift_patterns) / シフトひな型(shift_templates)
-- 適用順: schema.sql → rls.sql → 最小シード → payment-masters → checkout → retail → daily → menu-extras → tags → mail → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提に seed（パターン3・ひな型2）。
-- ★方針: アプリ側で空になり得る列は NULL 許容。2つとも参照なしのテナント共通マスタ（fee-master同型）。

-- ============================================================
-- 1. shift_patterns（テナント共通・時間帯プリセット）
-- ============================================================
create table if not exists public.shift_patterns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 未使用（NULL許容）
  name text not null,
  start_time text,                                                -- "HH:MM"（空可・time列にしない・NULL許容）
  end_time text,                                                  -- "HH:MM"（空可・NULL許容）
  sort_order integer not null default 0,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_shift_patterns_legacy_id on public.shift_patterns(legacy_id);
create index if not exists idx_shift_patterns_tenant on public.shift_patterns(tenant_id);
drop trigger if exists trg_shift_patterns_updated_at on public.shift_patterns;
create trigger trg_shift_patterns_updated_at before update on public.shift_patterns
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. shift_templates（テナント共通・ひな型メタ・現状UI表示のみ）
-- ============================================================
create table if not exists public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 未使用（NULL許容）
  name text not null,
  staff_count integer not null default 0,
  shift_count integer not null default 0,
  terminal text,                                                 -- 空可（NULL許容）
  sort_order integer not null default 0,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_shift_templates_legacy_id on public.shift_templates(legacy_id);
create index if not exists idx_shift_templates_tenant on public.shift_templates(tenant_id);
drop trigger if exists trg_shift_templates_updated_at on public.shift_templates;
create trigger trg_shift_templates_updated_at before update on public.shift_templates
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. RLS（2テーブルともテナント単位: 参照=スタッフ全員 / 変更=owner・manager）
-- ============================================================
alter table public.shift_patterns enable row level security;
drop policy if exists shift_patterns_select on public.shift_patterns;
create policy shift_patterns_select on public.shift_patterns for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists shift_patterns_write on public.shift_patterns;
create policy shift_patterns_write on public.shift_patterns for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

alter table public.shift_templates enable row level security;
drop policy if exists shift_templates_select on public.shift_templates;
create policy shift_templates_select on public.shift_templates for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists shift_templates_write on public.shift_templates;
create policy shift_templates_write on public.shift_templates for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- ============================================================
-- 4. seed（冪等・テナント=株式会社東邦）
-- ============================================================
insert into public.shift_patterns (legacy_id, tenant_id, name, start_time, end_time, sort_order)
select v.legacy_id, t.id, v.name, v.start_time, v.end_time, v.sort_order
from public.tenants t
cross join (values
  ('sp-001', '早番', '10:00', '19:00', 10),
  ('sp-002', '遅番', '13:00', '22:00', 20),
  ('sp-003', '通し', '10:00', '22:00', 30)
) as v(legacy_id, name, start_time, end_time, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;

insert into public.shift_templates (legacy_id, tenant_id, name, staff_count, shift_count, terminal, sort_order)
select v.legacy_id, t.id, v.name, v.staff_count, v.shift_count, v.terminal, v.sort_order
from public.tenants t
cross join (values
  ('st-001', '平日標準', 5, 5, '予約端末A', 10),
  ('st-002', '土日厚め', 7, 7, '予約端末A', 20)
) as v(legacy_id, name, staff_count, shift_count, terminal, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
