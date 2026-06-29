-- LUXAS フェーズ3 第4スライス: 日次運用の残り
--   expense_accounts(経費科目) / expense_entries(経費明細) / attendance(出退勤)
--   / daily_reports(日報) / daily_targets(日次目標)
-- 適用順: schema.sql → rls.sql → 最小シード → payment-masters → checkout → retail → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提に経費科目を seed（4件）。
-- ★方針: アプリ側で空になり得る列は NULL 許容（reservations.room_id の NOT NULL 事故の再発防止）。

-- ============================================================
-- 1. expense_accounts（テナント共通マスタ）
-- ============================================================
create table if not exists public.expense_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- テナント共通で未使用（NULL許容）
  name text not null,
  sub_name text,                                                  -- 補助科目（空可・NULL許容）
  sort_order integer not null default 0,
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_expense_accounts_legacy_id on public.expense_accounts(legacy_id);
create index if not exists idx_expense_accounts_tenant on public.expense_accounts(tenant_id);
drop trigger if exists trg_expense_accounts_updated_at on public.expense_accounts;
create trigger trg_expense_accounts_updated_at before update on public.expense_accounts
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. expense_entries（店舗別）
-- ============================================================
create table if not exists public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 店舗scope（NULL許容・mapperは既定店舗に解決）
  expense_date date not null,
  account_id uuid references public.expense_accounts(id) on delete set null,  -- legacy→uuid解決（NULL許容）
  account_legacy_id text,                                         -- round-trip用（アプリの accountId）
  amount integer not null default 0,
  note text,                                                      -- 空可（NULL許容）
  target_month text,                                              -- "YYYY-MM"（空可・NULL許容）
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_expense_entries_legacy_id on public.expense_entries(legacy_id);
create index if not exists idx_expense_entries_store_date on public.expense_entries(store_id, expense_date);
drop trigger if exists trg_expense_entries_updated_at on public.expense_entries;
create trigger trg_expense_entries_updated_at before update on public.expense_entries
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. attendance（出退勤・店舗別）
-- ============================================================
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 店舗scope（NULL許容）
  attend_date date not null,
  staff_id uuid references public.staff(id) on delete set null,   -- legacy→uuid解決（NULL許容）
  staff_legacy_id text,                                           -- round-trip用（アプリの staffId）
  clock_in text,                                                  -- "HH:MM"（空文字許容＝text・NULL許容）
  clock_out text,
  legacy_id text,                                                 -- 合成ID "date:store:staff"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_attendance_legacy_id on public.attendance(legacy_id);
create index if not exists idx_attendance_store_date on public.attendance(store_id, attend_date);
drop trigger if exists trg_attendance_updated_at on public.attendance;
create trigger trg_attendance_updated_at before update on public.attendance
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. daily_reports（日報・店舗別・id無し＝date+storeキー）
-- ============================================================
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 店舗scope（NULL許容）
  report_date date not null,
  result text,                                                    -- 以下すべて空可（NULL許容）
  achievement text,
  staff_proposals text,
  tomorrow_plan text,
  plan text,
  reflection text,
  shift_status text,
  weather text,
  submitted boolean not null default false,
  legacy_id text,                                                 -- 合成ID "date:store"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_daily_reports_legacy_id on public.daily_reports(legacy_id);
create index if not exists idx_daily_reports_store_date on public.daily_reports(store_id, report_date);
drop trigger if exists trg_daily_reports_updated_at on public.daily_reports;
create trigger trg_daily_reports_updated_at before update on public.daily_reports
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. daily_targets（日次目標・店舗別・id無し＝date+storeキー）
-- ============================================================
create table if not exists public.daily_targets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 店舗scope（NULL許容）
  target_date date not null,
  amount integer not null default 0,
  comment text,                                                   -- 空可（NULL許容）
  legacy_id text,                                                 -- 合成ID "date:store"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_daily_targets_legacy_id on public.daily_targets(legacy_id);
create index if not exists idx_daily_targets_store_date on public.daily_targets(store_id, target_date);
drop trigger if exists trg_daily_targets_updated_at on public.daily_targets;
create trigger trg_daily_targets_updated_at before update on public.daily_targets
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. RLS
-- ============================================================
-- expense_accounts（テナント単位）: 参照=スタッフ全員 / 変更=owner・manager
alter table public.expense_accounts enable row level security;
drop policy if exists expense_accounts_select on public.expense_accounts;
create policy expense_accounts_select on public.expense_accounts for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists expense_accounts_write on public.expense_accounts;
create policy expense_accounts_write on public.expense_accounts for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- 店舗別データ（明細/出退勤/日報/目標）: 参照・書込=自店舗スタッフ全員
alter table public.expense_entries enable row level security;
drop policy if exists expense_entries_rw on public.expense_entries;
create policy expense_entries_rw on public.expense_entries for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

alter table public.attendance enable row level security;
drop policy if exists attendance_rw on public.attendance;
create policy attendance_rw on public.attendance for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

alter table public.daily_reports enable row level security;
drop policy if exists daily_reports_rw on public.daily_reports;
create policy daily_reports_rw on public.daily_reports for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

alter table public.daily_targets enable row level security;
drop policy if exists daily_targets_rw on public.daily_targets;
create policy daily_targets_rw on public.daily_targets for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

-- ============================================================
-- 7. seed: 経費科目 標準4件（冪等・テナント=株式会社東邦）。他は seed なし。
-- ============================================================
insert into public.expense_accounts (legacy_id, tenant_id, name, sub_name, sort_order, is_active)
select v.legacy_id, t.id, v.name, v.sub_name, v.sort_order, true
from public.tenants t
cross join (values
  ('acc-001', '消耗品費',   '備品', 10),
  ('acc-002', '水道光熱費', '電気', 20),
  ('acc-003', '広告宣伝費', 'Web',  30),
  ('acc-004', '地代家賃',   '店舗', 40)
) as v(legacy_id, name, sub_name, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
