-- ⑤-公開: 匿名(anon)の公開予約に「時間帯ブロック」「スタッフ別ロック」を効かせる
-- 方針: 匿名は生テーブル不可・公開RPCのみ。返すのは時刻/スタッフ名・legacy_id だけ（機微なし）。
--       online_blocks/shifts/reservations はRPC内部でのみ参照（anonに開放しない）。security definer。
-- 冪等（create or replace）。anon/authenticated に EXECUTE 付与。

-- ============================================================
-- 1. get_online_staff(店舗code, 日付)
--    その日「出勤シフトあり ＆ オンラインロックされていない」スタッフのみ返す。
--    → ロック中スタッフを公開ページの候補から構造的に除外する。
-- ============================================================
create or replace function public.get_online_staff(p_store_code text, p_date date)
returns table(staff_legacy_id text, display_name text)
language sql stable security definer set search_path = public as $$
  select s.legacy_id, s.display_name
  from public.staff s
  join public.stores st on st.id = s.store_id and st.code = p_store_code and st.is_active
  where s.is_active
    and exists (
      select 1 from public.shifts sh
      where sh.staff_id = s.id and sh.shift_date = p_date and sh.is_active
    )
    and not exists (
      select 1 from public.online_blocks lk
      where lk.staff_id = s.id and lk.block_date = p_date
        and (lk.store_id = s.store_id or lk.store_id is null)
    )
  order by s.sort_order
$$;

-- ============================================================
-- 2. get_open_slots(店舗code, 日付, メニュー, 任意:指名スタッフlegacy) を本物化
--    反映: 営業時間内 / 時間帯online_blocks除外 / 出勤シフト内・休憩外 /
--          スタッフ別ロック除外 / スタッフ予約重複なし / ブース(施術台)同時上限。
--    返すのは開始時刻だけ（setof time）。指名ありはそのスタッフだけで判定。
--    旧シグネチャ(uuid,date,uuid)は店舗codeベースに置換。
-- ============================================================
drop function if exists public.get_open_slots(uuid, date, uuid);

create or replace function public.get_open_slots(
  p_store_code text,
  p_date date,
  p_service_id uuid,
  p_staff_legacy text default null
)
returns setof time
language plpgsql stable security definer set search_path = public as $$
declare
  v_store uuid; v_tenant uuid; v_open time; v_close time; v_step int; v_dur int; v_booths int; t time; v_end time;
begin
  select id, tenant_id, business_start, business_end, slot_minutes
    into v_store, v_tenant, v_open, v_close, v_step
  from public.stores where code = p_store_code and is_active;
  if v_store is null then return; end if;

  select duration_minutes into v_dur from public.services
   where id = p_service_id and is_active and tenant_id = v_tenant;
  if v_dur is null or v_dur <= 0 then return; end if;

  select count(*) into v_booths from public.rooms
   where store_id = v_store and is_active and kind = 'treatment';
  if coalesce(v_booths, 0) = 0 then return; end if;

  t := v_open;
  while (t + (v_dur || ' minutes')::interval)::time <= v_close loop
    v_end := (t + (v_dur || ' minutes')::interval)::time;

    if not exists (  -- 時間帯ブロック（店舗/全店・staff_id無し）に重なる枠は除外
      select 1 from public.online_blocks ob
      where ob.block_date = p_date and ob.staff_id is null
        and (ob.store_id = v_store or ob.store_id is null)
        and ob.start_time is not null and ob.end_time is not null
        and t < ob.end_time::time and ob.start_time::time < v_end
    )
    and exists (  -- 対応できるスタッフが1人以上（出勤・休憩外・ロックなし・予約重複なし）
      select 1 from public.staff s
      where s.store_id = v_store and s.is_active
        and (p_staff_legacy is null or s.legacy_id = p_staff_legacy)
        and exists (
          select 1 from public.shifts sh
          where sh.staff_id = s.id and sh.shift_date = p_date and sh.is_active
            and sh.start_time <= t and sh.end_time >= v_end
            and not (sh.break_start is not null and sh.break_end is not null and t < sh.break_end and sh.break_start < v_end)
        )
        and not exists (
          select 1 from public.online_blocks lk
          where lk.staff_id = s.id and lk.block_date = p_date
            and (lk.store_id = v_store or lk.store_id is null)
        )
        and not exists (
          select 1 from public.reservations r
          where r.staff_id = s.id and r.reservation_date = p_date and r.status <> 'canceled'
            and r.start_time < v_end and t < r.end_time
        )
    )
    and (  -- ブース同時上限
      select count(*) from public.reservations r2
      where r2.store_id = v_store and r2.reservation_date = p_date and r2.status <> 'canceled'
        and r2.start_time < v_end and t < r2.end_time
    ) < v_booths
    then
      return next t;
    end if;

    t := (t + (v_step || ' minutes')::interval)::time;
  end loop;
  return;
end;
$$;

revoke all on function public.get_online_staff(text, date) from public;
grant execute on function public.get_online_staff(text, date) to anon, authenticated;
revoke all on function public.get_open_slots(text, date, uuid, text) from public;
grant execute on function public.get_open_slots(text, date, uuid, text) to anon, authenticated;
