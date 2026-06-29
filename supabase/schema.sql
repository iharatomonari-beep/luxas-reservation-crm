-- LUXAS Reservation CRM
-- Supabase PostgreSQL 初期スキーマ
--
-- 注意:
-- - このSQLは初期DDLです。
-- - 本物の顧客情報はまだ投入しません。
-- - 顧客情報、カルテ、注意事項、CSV出力は本番前に権限制御を必ず検討してください。
-- - RLS はこの段階では方針コメントのみで、完全なポリシー実装は別途行います。

create extension if not exists pgcrypto;

-- updated_at を自動更新する共通トリガー
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  timezone text not null default 'Asia/Tokyo',
  business_start time not null,
  business_end time not null,
  slot_minutes integer not null default 15,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  display_name text not null,
  email text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null,
  scope_store_id uuid references public.stores(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  full_name text not null,
  display_name text not null,
  role text not null,
  sort_order integer not null default 0,
  service_menu_ids uuid[] not null default '{}'::uuid[],
  is_active boolean not null default true,
  memo text,
  -- 移行パイロット（第3区切り）: PM拡張項目を格納する profile と、旧localStorage文字列IDを保持する legacy_id。
  profile jsonb not null default '{}'::jsonb,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_staff_legacy_id on public.staff(legacy_id);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  category text not null,
  duration_minutes integer not null,
  price integer not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  memo text,
  -- 移行パイロット（第3区切り）: PM拡張項目を格納する profile と、旧localStorage文字列IDを保持する legacy_id。
  profile jsonb not null default '{}'::jsonb,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_services_legacy_id on public.services(legacy_id);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  kind text not null,
  memo text,
  is_active boolean not null default true,
  -- 移行パイロット（第3区切り）: PM拡張項目を格納する profile と、旧localStorage文字列IDを保持する legacy_id。
  profile jsonb not null default '{}'::jsonb,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_rooms_legacy_id on public.rooms(legacy_id);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  break_start time,
  break_end time,
  memo text,
  is_active boolean not null default true,
  -- 移行パイロット（第3区切り）: round-trip用 profile（staffLegacyId等）と、旧localStorage文字列ID。
  profile jsonb not null default '{}'::jsonb,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shifts_end_after_start check (end_time > start_time),
  constraint shifts_break_order check (
    (break_start is null and break_end is null)
    or (break_start is not null and break_end is not null and break_end > break_start)
  )
);

create unique index if not exists uq_shifts_legacy_id on public.shifts(legacy_id);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  peak_manager_customer_id text,
  name text not null,
  name_kana text,
  phone text,
  email text,
  birth_date date,
  gender text,
  postal_code text,
  prefecture text,
  address_line1 text,
  address_line2 text,
  address text,
  membership_number text,
  occupation text,
  dm_send text,
  newsletter_email text,
  rank text,
  first_visit_at timestamptz,
  first_visit_store text,
  last_visit_at timestamptz,
  last_visit_store text,
  total_visits integer not null default 0,
  total_sales_ex_tax bigint not null default 0,
  total_sales_inc_tax bigint not null default 0,
  phone_reservation_count integer not null default 0,
  pc_online_reservation_count integer not null default 0,
  mobile_online_reservation_count integer not null default 0,
  cancel_count integer not null default 0,
  no_show_count integer not null default 0,
  caution text,
  chart_memo text,
  tags text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  staff_id uuid not null references public.staff(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  -- 通常の施術ブースは容量ベースで部屋を固定しない（T011）。個室予約のみ room_id を持つため NULL 許容。
  room_id uuid references public.rooms(id) on delete restrict,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'booked',
  memo text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  -- 移行（第3区切り）: JS拡張項目＋round-trip用 profile（参照IDの legacy 保持）と、旧localStorage文字列ID。
  profile jsonb not null default '{}'::jsonb,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_end_after_start check (end_time > start_time)
);

create unique index if not exists uq_reservations_legacy_id on public.reservations(legacy_id);

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  author_user_id uuid references public.users(id) on delete set null,
  note_type text not null,
  body text not null,
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reservation_resources (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  resource_type text not null,
  resource_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  dataset_key text not null,
  source_file_name text,
  source_file_hash text,
  status text not null,
  total_rows integer not null default 0,
  success_rows integer not null default 0,
  failure_rows integer not null default 0,
  error_summary text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  actor_role text not null,
  action_type text not null,
  target_type text not null,
  target_id uuid,
  detail jsonb not null default '{}'::jsonb,
  result text not null,
  created_at timestamptz not null default now()
);

-- index
create index if not exists idx_users_store_id on public.users(store_id);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_staff_store_id_active on public.staff(store_id, is_active);
create index if not exists idx_staff_store_id_sort_order on public.staff(store_id, sort_order);
create index if not exists idx_services_store_id_active on public.services(store_id, is_active);
create index if not exists idx_services_store_id_sort_order on public.services(store_id, sort_order);
create index if not exists idx_rooms_store_id_active on public.rooms(store_id, is_active);
create index if not exists idx_shifts_store_staff_date on public.shifts(store_id, staff_id, shift_date);
create index if not exists idx_shifts_store_date on public.shifts(store_id, shift_date);
create index if not exists idx_customers_store_name on public.customers(store_id, name);
create index if not exists idx_customers_store_name_kana on public.customers(store_id, name_kana);
create index if not exists idx_customers_store_phone on public.customers(store_id, phone);
create index if not exists idx_customers_store_membership_number on public.customers(store_id, membership_number);
create index if not exists idx_customer_notes_customer_created_at on public.customer_notes(customer_id, created_at desc);
create index if not exists idx_reservations_store_date on public.reservations(store_id, reservation_date);
create index if not exists idx_reservations_store_staff_date on public.reservations(store_id, staff_id, reservation_date);
create index if not exists idx_reservations_store_room_date on public.reservations(store_id, room_id, reservation_date);
create index if not exists idx_reservation_resources_reservation_id on public.reservation_resources(reservation_id);
create index if not exists idx_import_jobs_store_created_at on public.import_jobs(store_id, created_at desc);
create index if not exists idx_audit_logs_store_created_at on public.audit_logs(store_id, created_at desc);
create index if not exists idx_audit_logs_action_type on public.audit_logs(action_type);

-- updated_at triggers
drop trigger if exists trg_stores_updated_at on public.stores;
create trigger trg_stores_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_staff_updated_at on public.staff;
create trigger trg_staff_updated_at
before update on public.staff
for each row execute function public.set_updated_at();

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists trg_rooms_updated_at on public.rooms;
create trigger trg_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

drop trigger if exists trg_shifts_updated_at on public.shifts;
create trigger trg_shifts_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

-- RLS方針メモ:
-- 1. stores で単一店舗に絞る。
-- 2. users / user_roles で auth.uid() と業務ロールを接続する。
-- 3. customers / customer_notes / reservations はロール別に参照・更新を制御する。
-- 4. audit_logs は owner / manager のみ参照可にする。
-- 5. CSVエクスポートは owner 限定の前提で別途ポリシー化する。
-- 6. 予約可否判定は画面側とDB側の両方で確認する。
