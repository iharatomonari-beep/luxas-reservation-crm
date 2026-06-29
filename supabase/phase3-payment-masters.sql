-- LUXAS フェーズ3 第1スライス: 決済マスタ（クレジットカード会社 / 電子マネー）
-- 適用順: schema.sql → rls.sql → 最小シード(tenants 等) → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提にシードする。

-- ============================================================
-- 1. credit_card_companies
-- ============================================================
create table if not exists public.credit_card_companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,  -- 将来の店舗別上書き用・当面null
  name text not null,
  fee_percent numeric(5,2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  legacy_id text,                                                -- 旧localStorage文字列ID（突き合わせキー）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_credit_card_companies_legacy_id on public.credit_card_companies(legacy_id);
create index if not exists idx_credit_card_companies_tenant on public.credit_card_companies(tenant_id);

drop trigger if exists trg_credit_card_companies_updated_at on public.credit_card_companies;
create trigger trg_credit_card_companies_updated_at before update on public.credit_card_companies
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. emoney_brands
-- ============================================================
create table if not exists public.emoney_brands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  name text not null,
  fee_percent numeric(5,2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_emoney_brands_legacy_id on public.emoney_brands(legacy_id);
create index if not exists idx_emoney_brands_tenant on public.emoney_brands(tenant_id);

drop trigger if exists trg_emoney_brands_updated_at on public.emoney_brands;
create trigger trg_emoney_brands_updated_at before update on public.emoney_brands
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. RLS（テナント単位。参照=スタッフ全員 / 変更=owner・manager）
-- ============================================================
alter table public.credit_card_companies enable row level security;
drop policy if exists ccc_select on public.credit_card_companies;
create policy ccc_select on public.credit_card_companies for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists ccc_write on public.credit_card_companies;
create policy ccc_write on public.credit_card_companies for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

alter table public.emoney_brands enable row level security;
drop policy if exists emb_select on public.emoney_brands;
create policy emb_select on public.emoney_brands for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists emb_write on public.emoney_brands;
create policy emb_write on public.emoney_brands for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- ============================================================
-- 4. seed（標準値・冪等・テナント=株式会社東邦）
-- ============================================================
insert into public.credit_card_companies (legacy_id, tenant_id, name, fee_percent, sort_order, is_active)
select v.legacy_id, t.id, v.name, v.fee_percent, v.sort_order, true
from public.tenants t
cross join (values
  ('cc-001', 'VISA', 3.25, 10),
  ('cc-002', 'Mastercard', 3.25, 20),
  ('cc-003', 'JCB', 3.74, 30),
  ('cc-004', 'AMEX', 3.74, 40)
) as v(legacy_id, name, fee_percent, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;

insert into public.emoney_brands (legacy_id, tenant_id, name, fee_percent, sort_order, is_active)
select v.legacy_id, t.id, v.name, v.fee_percent, v.sort_order, true
from public.tenants t
cross join (values
  ('em-001', 'Suica', 3.0, 10),
  ('em-002', 'iD', 3.0, 20),
  ('em-003', 'QUICPay', 3.0, 30),
  ('em-004', 'PayPay', 1.98, 40)
) as v(legacy_id, name, fee_percent, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
