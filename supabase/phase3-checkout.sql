-- LUXAS フェーズ3 第2スライス: 会計アイテムマスタ(checkout_items) ＋ レジ記録(register_records)
-- 適用順: schema.sql → rls.sql → 最小シード(tenants等) → phase3-payment-masters.sql → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提に seed。
-- ★方針: アプリ側で空になり得る列は NULL 許容（reservations.room_id の NOT NULL 事故の再発防止）。

-- ============================================================
-- 1. checkout_items（テナント共通マスタ）
-- ============================================================
create table if not exists public.checkout_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,  -- mapper必須付与＋RLS要求
  store_id uuid references public.stores(id) on delete cascade,             -- テナント共通で未使用（NULL許容）
  kind text not null,                                                       -- discount/couponUse/ticketUse/couponSale/ticketSale/retail（enum制約なし）
  name text not null,
  amount integer not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  legacy_id text,                                                           -- 旧localStorage文字列ID（突き合わせキー）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_checkout_items_legacy_id on public.checkout_items(legacy_id);
create index if not exists idx_checkout_items_tenant on public.checkout_items(tenant_id);
drop trigger if exists trg_checkout_items_updated_at on public.checkout_items;
create trigger trg_checkout_items_updated_at before update on public.checkout_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. register_records（店舗別・日次）
-- ============================================================
create table if not exists public.register_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,             -- 旧データはstoreId無し（NULL許容・mapperは既定店舗に解決）
  record_date date not null,
  kind text not null,                                                       -- open/check/close（enum制約なし）
  counts jsonb not null default '{}'::jsonb,                                -- 金種→枚数
  memo text,                                                                -- 空になり得る（NULL許容）
  legacy_id text,                                                           -- 合成ID "date:store:kind"（突き合わせキー）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_register_records_legacy_id on public.register_records(legacy_id);
create index if not exists idx_register_records_store_date on public.register_records(store_id, record_date);
drop trigger if exists trg_register_records_updated_at on public.register_records;
create trigger trg_register_records_updated_at before update on public.register_records
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. RLS
-- ============================================================
-- checkout_items（テナント単位）: 参照=スタッフ全員 / 変更=owner・manager
alter table public.checkout_items enable row level security;
drop policy if exists checkout_items_select on public.checkout_items;
create policy checkout_items_select on public.checkout_items for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists checkout_items_write on public.checkout_items;
create policy checkout_items_write on public.checkout_items for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- register_records（店舗単位）: 参照・書込=自店舗スタッフ全員（日次運用）
alter table public.register_records enable row level security;
drop policy if exists register_records_rw on public.register_records;
create policy register_records_rw on public.register_records for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

-- ============================================================
-- 4. seed: 会計アイテム標準プリセット（冪等・テナント=株式会社東邦）
--    register_records は seed なし（日次データ＝空開始）。
-- ============================================================
insert into public.checkout_items (legacy_id, tenant_id, kind, name, amount, sort_order, is_active)
select v.legacy_id, t.id, v.kind, v.name, v.amount, v.sort_order, true
from public.tenants t
cross join (values
  ('coi-d-001',  'discount',   '500円クーポン', 500,   10),
  ('coi-d-002',  'discount',   'リピート割引',  1000,  20),
  ('coi-d-003',  'discount',   '社割60分',      2000,  30),
  ('coi-cu-001', 'couponUse',  '回数券利用',    5000,  10),
  ('coi-tu-001', 'ticketUse',  'チケット利用',  6000,  10),
  ('coi-cs-001', 'couponSale', '回数券',        30000, 10),
  ('coi-ts-001', 'ticketSale', '60分チケット',  6000,  10),
  ('coi-r-001',  'retail',     'シャンプー',    2200,  10),
  ('coi-r-002',  'retail',     '福袋',          5000,  20)
) as v(legacy_id, kind, name, amount, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
