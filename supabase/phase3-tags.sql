-- LUXAS フェーズ3 第6スライス: タグ3種（顧客/予約ルート/施術カルテ）= master_tags 1テーブル＋kind列
-- 適用順: schema.sql → rls.sql → 最小シード → payment-masters → checkout → retail → daily → menu-extras → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提に seed（8件）。
-- ★方針: アプリ側で空になり得る列は NULL 許容。タグ自身は他を参照しない（fee-master同型）。
-- ★参照整合: 予約の bookingTagIds は legacy_id を参照 → fromRow で id=legacy_id 復元により維持。

-- ============================================================
-- 1. master_tags（テナント共通・1テーブル+kind）
-- ============================================================
create table if not exists public.master_tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- テナント共通で未使用（NULL許容）
  name text not null,
  code text,                                                      -- ルート以外は空（NULL許容）
  kind text not null,                                             -- customer/route/karte（enum制約なし）
  sort_order integer not null default 0,
  is_active boolean not null default true,
  legacy_id text,                                                 -- 旧文字列ID（予約 bookingTagIds の参照キー）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_master_tags_legacy_id on public.master_tags(legacy_id);
create index if not exists idx_master_tags_tenant_kind on public.master_tags(tenant_id, kind);
drop trigger if exists trg_master_tags_updated_at on public.master_tags;
create trigger trg_master_tags_updated_at before update on public.master_tags
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. RLS（テナント単位: 参照=スタッフ全員 / 変更=owner・manager）
-- ============================================================
alter table public.master_tags enable row level security;
drop policy if exists master_tags_select on public.master_tags;
create policy master_tags_select on public.master_tags for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists master_tags_write on public.master_tags;
create policy master_tags_write on public.master_tags for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- ============================================================
-- 3. seed: 初期タグ8件（冪等・テナント=株式会社東邦）
-- ============================================================
insert into public.master_tags (legacy_id, tenant_id, name, code, kind, sort_order, is_active)
select v.legacy_id, t.id, v.name, v.code, v.kind, v.sort_order, true
from public.tenants t
cross join (values
  ('tag-001', 'VIP',          '',     'customer', 10),
  ('tag-002', 'アレルギーあり', '',     'customer', 20),
  ('tag-101', 'ホームページ',   'HP',   'route',    10),
  ('tag-102', 'メール',         'MAIL', 'route',    20),
  ('tag-103', 'Instagram',     'IG',   'route',    30),
  ('tag-104', '多言語看板',     'SIGN', 'route',    40),
  ('tag-201', '肩こり',         '',     'karte',    10),
  ('tag-202', '腰痛',           '',     'karte',    20)
) as v(legacy_id, name, code, kind, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
