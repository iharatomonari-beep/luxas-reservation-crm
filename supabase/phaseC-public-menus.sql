-- ⑤-公開 SQL#1: 匿名向けオンライン対象メニュー取得（店舗code・ホワイトリスト方式）
-- client の onlineMenusForStore 相当をSQLへ:
--   isActive && onlineBooking===true && (storeScope!='selected' || storeIds に店舗code を含む)
-- services はテナント共通カタログ（store_id は渋谷寄せ）なので、店舗判定は profile.storeIds で行う。
-- 返すのは公開に必要な最小列のみ（機微なし）。security definer・anon/authenticated に EXECUTE。冪等。

create or replace function public.get_online_menus(p_store_code text)
returns table(service_id uuid, name text, category text, duration_minutes int, price int)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.category, s.duration_minutes, s.price
  from public.services s
  where s.is_active
    and s.tenant_id = (select st.tenant_id from public.stores st where st.code = p_store_code and st.is_active)
    and (s.profile ->> 'onlineBooking')::boolean is true
    and (
      (s.profile ->> 'storeScope') is distinct from 'selected'
      or (s.profile -> 'storeIds') ? p_store_code
    )
  order by s.sort_order
$$;

revoke all on function public.get_online_menus(text) from public;
grant execute on function public.get_online_menus(text) to anon, authenticated;
