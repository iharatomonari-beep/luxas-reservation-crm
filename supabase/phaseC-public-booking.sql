-- ⑤-公開 SQL#2: 匿名のオンライン予約確定（code版・room任意・指名なしは自動割当）
-- ・room_id は null 可（通常予約＝容量ベース）。ブース同時上限を再検証。
-- ・指名あり: そのスタッフが出勤/休憩外/ロックなし/予約重複なし を検証。
-- ・指名なし(p_staff_legacy=null): サーバー側で空きスタッフを自動割当（sort_order順の先頭）。
-- ・時間帯ブロック/営業時間/過去日時も再検証（get_open_slots と同条件）。最終の二重予約防止はEXCLUDE制約。
-- ・ゲスト顧客は「お客様自身のオンライン予約による登録」。security definer・anon/authenticated 付与。冪等。

create or replace function public.create_online_booking_v2(
  p_store_code text,
  p_service_id uuid,
  p_date date,
  p_start time,
  p_customer_name text,
  p_staff_legacy text default null,
  p_customer_phone text default null,
  p_customer_email text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_store uuid; v_tenant uuid; v_dur int; v_end time; v_staff uuid; v_booths int; v_customer uuid; v_res uuid;
begin
  select id, tenant_id into v_store, v_tenant from public.stores where code = p_store_code and is_active;
  if v_store is null then raise exception 'invalid store'; end if;

  select duration_minutes into v_dur from public.services
   where id = p_service_id and is_active and tenant_id = v_tenant;
  if v_dur is null then raise exception 'invalid service'; end if;
  v_end := (p_start + (v_dur || ' minutes')::interval)::time;

  -- 過去日時・営業時間外
  if (p_date + p_start) < (now() at time zone 'Asia/Tokyo') then raise exception 'past datetime'; end if;
  if not exists (select 1 from public.stores s where s.id = v_store and p_start >= s.business_start and v_end <= s.business_end) then
    raise exception 'outside business hours';
  end if;

  -- 時間帯ブロック
  if exists (
    select 1 from public.online_blocks ob
    where ob.block_date = p_date and ob.staff_id is null and (ob.store_id = v_store or ob.store_id is null)
      and ob.start_time is not null and ob.end_time is not null
      and p_start < ob.end_time::time and ob.start_time::time < v_end
  ) then raise exception 'slot blocked'; end if;

  -- スタッフ決定（指名 or 自動割当）。出勤/休憩外/ロックなし/予約重複なし。
  select s.id into v_staff
  from public.staff s
  where s.store_id = v_store and s.is_active
    and (p_staff_legacy is null or s.legacy_id = p_staff_legacy)
    and exists (
      select 1 from public.shifts sh
      where sh.staff_id = s.id and sh.shift_date = p_date and sh.is_active
        and sh.start_time <= p_start and sh.end_time >= v_end
        and not (sh.break_start is not null and sh.break_end is not null and p_start < sh.break_end and sh.break_start < v_end)
    )
    and not exists (
      select 1 from public.online_blocks lk
      where lk.staff_id = s.id and lk.block_date = p_date and (lk.store_id = v_store or lk.store_id is null)
    )
    and not exists (
      select 1 from public.reservations r
      where r.staff_id = s.id and r.reservation_date = p_date and r.status <> 'canceled'
        and r.start_time < v_end and p_start < r.end_time
    )
  order by s.sort_order
  limit 1;
  if v_staff is null then raise exception 'no available staff'; end if;

  -- ブース同時上限
  select count(*) into v_booths from public.rooms where store_id = v_store and is_active and kind = 'treatment';
  if (
    select count(*) from public.reservations r
    where r.store_id = v_store and r.reservation_date = p_date and r.status <> 'canceled'
      and r.start_time < v_end and p_start < r.end_time
  ) >= coalesce(v_booths, 0) then raise exception 'no booth capacity'; end if;

  -- ゲスト顧客作成（お客様自身のオンライン予約）。
  insert into public.customers (tenant_id, store_id, home_store_id, name, phone, email)
  values (v_tenant, v_store, v_store, coalesce(nullif(trim(p_customer_name), ''), 'ゲスト'), p_customer_phone, p_customer_email)
  returning id into v_customer;

  -- 予約作成（room_id null = 容量ベース）。
  insert into public.reservations
    (tenant_id, store_id, customer_id, customer_name, customer_phone, staff_id, service_id, room_id,
     reservation_date, start_time, end_time, status, memo)
  values
    (v_tenant, v_store, v_customer, coalesce(nullif(trim(p_customer_name), ''), 'ゲスト'), p_customer_phone,
     v_staff, p_service_id, null, p_date, p_start, v_end, 'booked', 'online')
  returning id into v_res;

  return v_res;
end;
$$;

revoke all on function public.create_online_booking_v2(text, uuid, date, time, text, text, text, text) from public;
grant execute on function public.create_online_booking_v2(text, uuid, date, time, text, text, text, text) to anon, authenticated;
