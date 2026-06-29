-- LUXAS フェーズ3 第9スライス: 小マスタまとめ
--   online_blocks(オンライン予約停止) / turnaways(返客) / data_errors(データ不備) / user_directory(ユーザマスタ・表示のみ)
-- 適用順: schema.sql → rls.sql → 最小シード → payment-masters → checkout → retail → daily → menu-extras → tags → mail → shift-extras → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提に seed（data_errors 2・user_directory 2）。online_blocks/turnaways は空。
-- ★方針: アプリ側で空になり得る列は NULL 許容。
-- ★ユーザマスタは「表示のみ・認証非接触」。public.users（認証/RBAC）とは別物の user_directory を新設。Auth/user_roles に触れない。
-- 除外: EPARK設定（raw localStorage 単一設定・別途）/ member-change（イベント名・データでない）。

-- ============================================================
-- 1. online_blocks（店舗別・オンライン予約停止枠）
-- ============================================================
create table if not exists public.online_blocks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 店舗scope（NULL許容・既定店舗解決）
  block_date date not null,
  name text,                                                      -- 空可（NULL許容）
  block_id text,                                                  -- 自動生成コード（NULL許容）
  start_time text,                                                -- "HH:MM"（text・NULL許容）
  end_time text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_online_blocks_legacy_id on public.online_blocks(legacy_id);
create index if not exists idx_online_blocks_store_date on public.online_blocks(store_id, block_date);
drop trigger if exists trg_online_blocks_updated_at on public.online_blocks;
create trigger trg_online_blocks_updated_at before update on public.online_blocks
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. turnaways（店舗別・返客log）。service/staff/option は legacy ID保持（解決なし）。
-- ============================================================
create table if not exists public.turnaways (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 店舗scope（NULL許容）
  turnaway_date date not null,
  start_time text,
  kind text,
  gender text,
  reason text,
  comment text,
  service_menu_id text,                                           -- legacy ID保持（解決なし）
  option_ids jsonb not null default '[]'::jsonb,                  -- legacy ID配列
  preference text,
  nominated_staff_id text,                                        -- legacy ID保持（解決なし）
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_turnaways_legacy_id on public.turnaways(legacy_id);
create index if not exists idx_turnaways_store_date on public.turnaways(store_id, turnaway_date);
drop trigger if exists trg_turnaways_updated_at on public.turnaways;
create trigger trg_turnaways_updated_at before update on public.turnaways
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. data_errors（テナント共通・データ不備・表示のみ）
-- ============================================================
create table if not exists public.data_errors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  title text not null,
  occurred_at text,                                               -- "YYYY-MM-DD HH:MM"（NULL許容）
  category text,
  detail text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_data_errors_legacy_id on public.data_errors(legacy_id);
create index if not exists idx_data_errors_tenant on public.data_errors(tenant_id);
drop trigger if exists trg_data_errors_updated_at on public.data_errors;
create trigger trg_data_errors_updated_at before update on public.data_errors
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. user_directory（テナント共通・ユーザマスタ表示のみ・★public.usersとは別・認証非接触）
-- ============================================================
create table if not exists public.user_directory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  user_name text not null,
  login_id text,                                                  -- 表示用のみ（認証に使わない・NULL許容）
  sort_order integer not null default 0,
  last_login_at text,                                            -- 表示用文字列（NULL許容）
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_user_directory_legacy_id on public.user_directory(legacy_id);
create index if not exists idx_user_directory_tenant on public.user_directory(tenant_id);
drop trigger if exists trg_user_directory_updated_at on public.user_directory;
create trigger trg_user_directory_updated_at before update on public.user_directory
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. RLS
-- ============================================================
-- 店舗別（online_blocks/turnaways）: 参照・書込=自店舗スタッフ全員
alter table public.online_blocks enable row level security;
drop policy if exists online_blocks_rw on public.online_blocks;
create policy online_blocks_rw on public.online_blocks for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

alter table public.turnaways enable row level security;
drop policy if exists turnaways_rw on public.turnaways;
create policy turnaways_rw on public.turnaways for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

-- テナント共通（data_errors/user_directory）: 参照=スタッフ全員 / 変更=owner・manager
alter table public.data_errors enable row level security;
drop policy if exists data_errors_select on public.data_errors;
create policy data_errors_select on public.data_errors for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists data_errors_write on public.data_errors;
create policy data_errors_write on public.data_errors for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

alter table public.user_directory enable row level security;
drop policy if exists user_directory_select on public.user_directory;
create policy user_directory_select on public.user_directory for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists user_directory_write on public.user_directory;
create policy user_directory_write on public.user_directory for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- ============================================================
-- 6. seed（冪等・テナント=株式会社東邦）。online_blocks/turnaways は空。
-- ============================================================
insert into public.data_errors (legacy_id, tenant_id, title, occurred_at, category, detail)
select v.legacy_id, t.id, v.title, v.occurred_at, v.category, v.detail
from public.tenants t
cross join (values
  ('de-001', '電話番号が重複している顧客があります', '2026-06-14 09:12', '顧客データ', '同一電話番号の顧客が2件存在します。名寄せをご検討ください。'),
  ('de-002', '担当未設定の予約があります', '2026-06-15 08:40', '予約データ', '本日の予約のうち、担当スタッフが未設定のものがあります。')
) as v(legacy_id, title, occurred_at, category, detail)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;

insert into public.user_directory (legacy_id, tenant_id, user_name, login_id, sort_order, last_login_at)
select v.legacy_id, t.id, v.user_name, v.login_id, v.sort_order, v.last_login_at
from public.tenants t
cross join (values
  ('user-001', '店長アカウント', 'manager',   10, '2026-06-15 08:30'),
  ('user-002', '受付アカウント', 'reception', 20, '2026-06-14 19:05')
) as v(legacy_id, user_name, login_id, sort_order, last_login_at)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
