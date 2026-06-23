-- LUXAS Reservation CRM — テナンシー＋RLS層（第1区切り・設計）
-- 適用順: 1) schema.sql  2) このファイル
-- 方針の全体像は docs/db-tenancy-rls-design.md を参照。
--
-- 重要:
-- - これは「設計」段階のDDL。本番適用前にレビューし、必要に応じ NOT NULL 化/バックフィルを行う。
-- - service_role は RLS をバイパスする（移行・管理用）。アプリの通常アクセスは authenticated/anon。
-- - tenant_id 列は既存DBへの後付けを想定し、まず nullable で追加（空DBなら後で NOT NULL 化可）。

begin;

-- ============================================================
-- 1. テナント / エリア
-- ============================================================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. tenant_id / 補助列の後付け（idempotent）
-- ============================================================
alter table public.stores              add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.stores              add column if not exists area_id   uuid references public.areas(id)   on delete set null;
alter table public.users               add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.user_roles          add column if not exists scope_tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.staff               add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.services            add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.rooms               add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.shifts              add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.customers           add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.customers           add column if not exists home_store_id uuid references public.stores(id) on delete set null;
alter table public.reservations        add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.customer_notes      add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.reservation_resources add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.import_jobs         add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.audit_logs          add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_areas_tenant on public.areas(tenant_id);
create index if not exists idx_stores_tenant on public.stores(tenant_id);
create index if not exists idx_users_tenant on public.users(tenant_id);
create index if not exists idx_staff_tenant on public.staff(tenant_id);
create index if not exists idx_services_tenant on public.services(tenant_id);
create index if not exists idx_shifts_tenant on public.shifts(tenant_id);
create index if not exists idx_customers_tenant_name on public.customers(tenant_id, name);
create index if not exists idx_reservations_tenant_date on public.reservations(tenant_id, reservation_date);
create index if not exists idx_customer_notes_tenant on public.customer_notes(tenant_id);
create index if not exists idx_audit_logs_tenant on public.audit_logs(tenant_id);

-- 追加トリガー（新テーブルの updated_at）
drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();
drop trigger if exists trg_areas_updated_at on public.areas;
create trigger trg_areas_updated_at before update on public.areas
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. ヘルパー関数（RLSから参照。security definer + stable）
--    auth.uid() = ログイン中の Supabase ユーザー
-- ============================================================
create or replace function public.app_current_user_id()
returns uuid language sql stable security definer set search_path = public as $$
  select u.id from public.users u
  where u.auth_user_id = auth.uid() and u.is_active
  limit 1
$$;

create or replace function public.app_user_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select u.tenant_id from public.users u
  where u.auth_user_id = auth.uid() and u.is_active
  limit 1
$$;

create or replace function public.app_has_role(p_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.users u
    join public.user_roles r on r.user_id = u.id
    where u.auth_user_id = auth.uid() and u.is_active and r.role = any(p_roles)
  )
$$;

-- 触ってよい店舗集合: 全店ロール(scope_store_id is null)→テナント内全店 / 店舗限定ロール→その店舗
create or replace function public.app_user_store_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  -- 全店ロールを持つ場合: 自テナントの全店舗
  select s.id
  from public.stores s
  where s.tenant_id = public.app_user_tenant_id()
    and exists (
      select 1 from public.users u
      join public.user_roles r on r.user_id = u.id
      where u.auth_user_id = auth.uid() and u.is_active and r.scope_store_id is null
    )
  union
  -- 店舗限定ロール: その店舗のみ
  select r.scope_store_id
  from public.users u
  join public.user_roles r on r.user_id = u.id
  where u.auth_user_id = auth.uid() and u.is_active and r.scope_store_id is not null
$$;

-- ============================================================
-- 4. RLS 有効化
-- ============================================================
alter table public.tenants               enable row level security;
alter table public.areas                 enable row level security;
alter table public.stores                enable row level security;
alter table public.users                 enable row level security;
alter table public.user_roles            enable row level security;
alter table public.staff                 enable row level security;
alter table public.services              enable row level security;
alter table public.rooms                 enable row level security;
alter table public.shifts                enable row level security;
alter table public.customers             enable row level security;
alter table public.reservations          enable row level security;
alter table public.customer_notes        enable row level security;
alter table public.reservation_resources enable row level security;
alter table public.import_jobs           enable row level security;
alter table public.audit_logs            enable row level security;

-- ============================================================
-- 5. ポリシー（authenticated 向け）
--    複数の permissive ポリシーは OR される点に注意。
--    ここでは「テナント/店舗スコープ」を1本にまとめ、必要箇所のみロールで上書きする。
-- ============================================================

-- tenants: 自テナントのみ参照（作成/変更はプラットフォーム/service_role）
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants for select to authenticated
  using ( id = public.app_user_tenant_id() );

-- areas: 自テナント
drop policy if exists areas_rw on public.areas;
create policy areas_rw on public.areas for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() )
  with check ( tenant_id = public.app_user_tenant_id() );

-- stores: 参照=自テナント / 変更=owner のみ
drop policy if exists stores_select on public.stores;
create policy stores_select on public.stores for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists stores_write on public.stores;
create policy stores_write on public.stores for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner']) );

-- users / user_roles: 自テナント参照、管理は owner
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists users_write on public.users;
create policy users_write on public.users for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner']) );

drop policy if exists user_roles_rw on public.user_roles;
create policy user_roles_rw on public.user_roles for all to authenticated
  using ( exists (select 1 from public.users u where u.id = user_roles.user_id and u.tenant_id = public.app_user_tenant_id())
          and public.app_has_role(array['owner']) )
  with check ( exists (select 1 from public.users u where u.id = user_roles.user_id and u.tenant_id = public.app_user_tenant_id())
          and public.app_has_role(array['owner']) );

-- 店舗を持つ業務テーブル: store_id ∈ app_user_store_ids() で「自テナント＋触ってよい店舗」を一括強制
drop policy if exists staff_rw on public.staff;
create policy staff_rw on public.staff for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

drop policy if exists services_rw on public.services;
create policy services_rw on public.services for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

drop policy if exists rooms_rw on public.rooms;
create policy rooms_rw on public.rooms for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

drop policy if exists shifts_rw on public.shifts;
create policy shifts_rw on public.shifts for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

drop policy if exists reservations_rw on public.reservations;
create policy reservations_rw on public.reservations for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

drop policy if exists reservation_resources_rw on public.reservation_resources;
create policy reservation_resources_rw on public.reservation_resources for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

drop policy if exists import_jobs_rw on public.import_jobs;
create policy import_jobs_rw on public.import_jobs for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) and public.app_has_role(array['owner','manager']) )
  with check ( store_id in (select public.app_user_store_ids()) and public.app_has_role(array['owner','manager']) );

-- 顧客: 会社内共有（テナント単位）。店舗専属にする場合はここを store ベースへ差し替える。
drop policy if exists customers_rw on public.customers;
create policy customers_rw on public.customers for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() )
  with check ( tenant_id = public.app_user_tenant_id() );

-- カルテ等のノート: 当面はスタッフ全員が閲覧/編集可（施術に必要なため）。
-- 将来、機微(is_sensitive)を owner/manager 限定にする場合は、下記 using に
--   and (is_sensitive = false or public.app_has_role(array['owner','manager']))
-- を足すだけでよい（is_sensitive 列は将来の制限用に残してある）。
drop policy if exists customer_notes_select on public.customer_notes;
create policy customer_notes_select on public.customer_notes for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists customer_notes_write on public.customer_notes;
create policy customer_notes_write on public.customer_notes for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() )
  with check ( tenant_id = public.app_user_tenant_id() );

-- 監査ログ: 参照は owner/manager。書き込みは原則 definer 関数 or service_role。
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- ============================================================
-- 6. 機微列(caution / chart_memo)の列制御 — 当面は「全スタッフ閲覧可」のため未適用。
--    現状はスタッフ全員が customers 本体（caution / chart_memo 含む）を参照できる（施術に必要）。
--    将来「一般スタッフには機微列を隠す」とする場合に備え、機微列を除いたビューを用意しておく（今は未使用）。
--    そのときは一般スタッフ向け画面をこのビューに切替え、本体の SELECT を owner/manager に限定する。
-- ============================================================
-- security_invoker=true: ビューを「呼び出したユーザーの権限/RLS」で評価させる（既定の所有者権限だとRLSを迂回するため必須）。
create or replace view public.customers_basic
  with (security_invoker = true) as
  select id, tenant_id, home_store_id, name, name_kana, phone, email, birth_date,
         gender, membership_number, rank, total_visits, last_visit_at, is_active
  from public.customers;

-- ============================================================
-- 7. 公開オンライン予約（anon は生テーブル不可・RPCのみ）
--    anon には下記関数の EXECUTE だけを付与する。
--    ※availability の完全ロジック（online_blocks・シフト・ブース容量）は
--      features/reservations/availability.ts から移植して get_open_slots を仕上げる（第2区切り）。
-- ============================================================

-- 公開カタログ: 店舗の公開可能メニューのみ（PIIなし）
create or replace function public.get_online_catalog(p_store_id uuid)
returns table(service_id uuid, name text, category text, duration_minutes int, price int)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.category, s.duration_minutes, s.price
  from public.services s
  join public.stores st on st.id = s.store_id
  where s.store_id = p_store_id and s.is_active and st.is_active
  order by s.sort_order
$$;

-- 空き時刻（雛形）: 営業時間内をstep刻みで生成し、既存予約と重なる枠を除外。
-- TODO(第2区切り): online_blocks / シフト内判定 / ブース容量 / メニュー限定 を移植して厳密化する。
create or replace function public.get_open_slots(p_store_id uuid, p_date date, p_service_id uuid)
returns setof time
language plpgsql stable security definer set search_path = public as $$
declare
  v_open time; v_close time; v_step int; v_dur int; t time;
begin
  select business_start, business_end, slot_minutes into v_open, v_close, v_step
  from public.stores where id = p_store_id and is_active;
  if v_open is null then return; end if;
  select duration_minutes into v_dur from public.services where id = p_service_id and store_id = p_store_id;
  if v_dur is null then return; end if;

  t := v_open;
  while (t + (v_dur || ' minutes')::interval)::time <= v_close loop
    if not exists (
      select 1 from public.reservations r
      where r.store_id = p_store_id and r.reservation_date = p_date and r.status <> 'canceled'
        and r.start_time < (t + (v_dur || ' minutes')::interval)::time
        and t < r.end_time
    ) then
      return next t;
    end if;
    t := (t + (v_step || ' minutes')::interval)::time;
  end loop;
  return;
end;
$$;

-- 予約確定: サーバー側で店舗/メニュー整合・空きを再検証し、ゲスト顧客＋予約を作成。受付IDだけ返す。
create or replace function public.create_online_booking(
  p_store_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_room_id uuid,
  p_date date,
  p_start time,
  p_customer_name text,
  p_customer_phone text default null,
  p_customer_email text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid; v_dur int; v_end time; v_customer uuid; v_res uuid;
begin
  -- 店舗とテナント
  select tenant_id into v_tenant from public.stores where id = p_store_id and is_active;
  if v_tenant is null then raise exception 'invalid store'; end if;

  -- メニューは当該店舗のものか
  select duration_minutes into v_dur from public.services
  where id = p_service_id and store_id = p_store_id and is_active;
  if v_dur is null then raise exception 'invalid service'; end if;
  v_end := (p_start + (v_dur || ' minutes')::interval)::time;

  -- 空き再検証（同店舗・同枠の重複を拒否）
  if exists (
    select 1 from public.reservations r
    where r.store_id = p_store_id and r.reservation_date = p_date and r.status <> 'canceled'
      and r.start_time < v_end and p_start < r.end_time
      and (r.staff_id = p_staff_id or r.room_id = p_room_id)
  ) then
    raise exception 'slot not available';
  end if;

  -- ゲスト顧客作成（最小情報・テナント紐付け）
  insert into public.customers (tenant_id, store_id, home_store_id, name, phone, email)
  values (v_tenant, p_store_id, p_store_id, coalesce(nullif(trim(p_customer_name), ''), 'ゲスト'), p_customer_phone, p_customer_email)
  returning id into v_customer;

  -- 予約作成
  insert into public.reservations
    (tenant_id, store_id, customer_id, customer_name, customer_phone, staff_id, service_id, room_id,
     reservation_date, start_time, end_time, status, memo)
  values
    (v_tenant, p_store_id, v_customer, coalesce(nullif(trim(p_customer_name), ''), 'ゲスト'), p_customer_phone,
     p_staff_id, p_service_id, p_room_id, p_date, p_start, v_end, 'booked', 'online')
  returning id into v_res;

  return v_res;
end;
$$;

-- anon には RPC の EXECUTE のみ付与（生テーブル権限なし）
revoke all on function public.get_online_catalog(uuid) from public;
revoke all on function public.get_open_slots(uuid, date, uuid) from public;
revoke all on function public.create_online_booking(uuid, uuid, uuid, uuid, date, time, text, text, text) from public;
grant execute on function public.get_online_catalog(uuid) to anon, authenticated;
grant execute on function public.get_open_slots(uuid, date, uuid) to anon, authenticated;
grant execute on function public.create_online_booking(uuid, uuid, uuid, uuid, date, time, text, text, text) to anon, authenticated;

commit;

-- ============================================================
-- 適用後の手順（第2区切り）:
-- 1) tenants/areas/stores に初期データ投入（株式会社東邦→東京→各店舗）し、各テーブルの tenant_id をバックフィル。
-- 2) バックフィル後に tenant_id を NOT NULL 化（必要なら）。
-- 3) スタッフのログインユーザー(users)と user_roles を作成（owner/manager/staff）。
-- 4) get_open_slots に availability.ts の規則（online_blocks/シフト/ブース容量/メニュー限定）を移植。
-- 5) アプリのデータ層を localStorage→Supabase へ1領域ずつ移行。
-- ============================================================
