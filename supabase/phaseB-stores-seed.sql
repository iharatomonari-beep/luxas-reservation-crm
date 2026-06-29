-- 案B（多店舗・B-min）① 他6店舗を stores に追加
-- ★不変条件：stores.code = アプリ Store.id（"store-gotanda-east" 等）。アプリ Store.code("GOTANDA_EAST")は使わない。
-- ★渋谷行（code='store-shibuya'）には一切触れない（リストに含めない・on conflict do nothing）。
-- tenant_id/area_id は既存の唯一の tenant/area を使用。営業時間は既定（10:00-23:00・slot5）。
-- 冪等（再実行安全）。org の読みは localStorage 据え置き（org mapper は使わない＝B-min）。

insert into public.stores (name, code, tenant_id, area_id, business_start, business_end, slot_minutes, is_active)
select
  v.name,
  v.code,
  (select id from public.tenants order by created_at limit 1),
  (select id from public.areas   order by created_at limit 1),
  time '10:00',
  time '23:00',
  5,
  true
from (values
  ('LUXAS五反田東口',        'store-gotanda-east'),
  ('LUXAS五反田西口',        'store-gotanda-west'),
  ('LUXAS錦糸町',            'store-kinshicho'),
  ('LUXASプレミアム溝の口',   'store-mizonokuchi-premium'),
  ('LUXAS＋元町中華街',       'store-motomachi-chukagai-plus'),
  ('LUXAS中目黒',            'store-nakameguro')
) as v(name, code)
on conflict (code) do nothing;
