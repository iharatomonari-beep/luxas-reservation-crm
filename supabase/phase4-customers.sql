-- LUXAS フェーズ4 顧客（customers）DB化 — S1: 器の最終調整＋ダミー2件seed（★実名簿は入れない）
-- 適用順: schema.sql → rls.sql → 最小シード → 各 phase3-*.sql → phaseA-*.sql → このファイル。
-- 冪等（再実行安全）。customers テーブル本体・RLS は schema.sql / rls.sql で既に定義済み。
--
-- 方針（§6オーナー判断 2026-06-28）:
--  - 参照範囲は当面「テナント全員（全スタッフ閲覧可）」＝既存 rls.sql の customers_* ポリシーのまま（変更なし）。
--  - 型⇔列ギャップは staff/services と同じ「profile(jsonb) 退避」方式:
--      コアPII列（name/kana/phone/email/birth_date/gender/address/postal_code/prefecture/
--      address_line1,2/membership_number/occupation/caution/chart_memo/tags/is_active/
--      peak_manager_customer_id）は実列にマッピング。
--      テーブルに無い追加項目（firstVisitDate/lastVisitDate/caution1,2/各visit・sales集計/
--      phone2,3/email2/acceptsEmail,Dm,Push/comment/note1,2/homeStoreId/effective*/createdAt 等）は
--      customers.profile(jsonb) に退避する。
--  - customer_notes は当面使わない（caution/chart_memo を顧客レコード側に保持）。時系列ノート化は別タスク。
--  - ★教訓: アプリで空になり得る列は NULL 許容のまま（room_id事件の再発防止）。下の列はすべて NULL 許容済み。

-- ============================================================
-- 1. 移行用カラム追加（legacy_id ＝ JS文字列ID の橋 / profile ＝ 追加項目退避）
-- ============================================================
alter table public.customers add column if not exists legacy_id text;
alter table public.customers add column if not exists profile jsonb not null default '{}'::jsonb;

-- legacy_id は突き合わせキー。UPDATE/DELETE を legacy_id で行うため一意制約を張る。
create unique index if not exists uq_customers_legacy_id on public.customers(legacy_id);

-- ============================================================
-- 2. ダミー2件 seed（★架空データのみ。mock-data.ts の customer-001 / customer-002 と一致）
--    store_id / tenant_id は 渋谷店から解決。RLS は SQL Editor 実行（postgres/service_role）でバイパスされる。
--    profile には「列に無い必須項目」firstVisitDate / lastVisitDate を格納（mapper の toRow 出力と一致）。
--    冪等: legacy_id 一意のため ON CONFLICT DO NOTHING。
-- ============================================================
insert into public.customers (
  legacy_id, tenant_id, store_id,
  name, name_kana, phone, email, birth_date, gender, address,
  caution, chart_memo, tags, is_active, profile
)
select
  v.legacy_id,
  (select s.tenant_id from public.stores s where s.code = 'store-shibuya' limit 1),
  (select s.id        from public.stores s where s.code = 'store-shibuya' limit 1),
  v.name, v.name_kana, v.phone, v.email, v.birth_date::date, v.gender, v.address,
  v.caution, v.chart_memo, v.tags, v.is_active, v.profile::jsonb
from (
  values
    (
      'customer-001', '森下 彩', 'モリシタ アヤ', '090-1111-2222', 'aya.morishita@example.jp',
      '1995-04-18', 'female', '東京都渋谷区神宮前1-1-1',
      '肩まわりに強い刺激は避ける。', '初回。カウンセリング時に睡眠不足の相談あり。',
      array['初回','肩','保湿']::text[], true,
      '{"firstVisitDate":"2026-05-11","lastVisitDate":"2026-05-11"}'
    ),
    (
      'customer-002', '神谷 玲奈', 'カミヤ レイナ', '080-3333-4444', 'reina.kamiya@example.jp',
      '1992-09-02', 'female', '東京都港区南青山2-3-4',
      '乾燥しやすい。施術後の保湿案内を毎回確認。', '次回来店時に保湿ケアを提案。',
      array['再来','乾燥','提案記録']::text[], true,
      '{"firstVisitDate":"2026-05-11","lastVisitDate":"2026-05-11"}'
    )
) as v(
  legacy_id, name, name_kana, phone, email, birth_date, gender, address,
  caution, chart_memo, tags, is_active, profile
)
on conflict (legacy_id) do nothing;
