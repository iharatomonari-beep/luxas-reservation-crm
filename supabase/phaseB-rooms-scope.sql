-- 案B（多店舗）: rooms を店舗スコープ化
-- ① profile jsonb を追加（アプリの homeStoreId 等を往復保持。staff/services と同方式）。空はNULL許容の思想だが
--    既存パターンに合わせ NOT NULL default '{}'（中身は空可）。
-- ② 既存ブース（store_id=渋谷）を渋谷所属に明示（profile.homeStoreId='store-shibuya'）。
--    → 渋谷のブースは引き続きちょうど10。アプリ側は homeStoreId 未設定でも既定店舗(渋谷)扱いだが、明示しておく。
-- 冪等（再実行安全）。★渋谷の rooms 行の本体（id/name/kind等）は変更しない（profile のみ付与）。

alter table public.rooms add column if not exists profile jsonb not null default '{}'::jsonb;

update public.rooms
set profile = jsonb_set(coalesce(profile, '{}'::jsonb), '{homeStoreId}', '"store-shibuya"')
where store_id = (select id from public.stores where code = 'store-shibuya' limit 1)
  and (profile ->> 'homeStoreId') is null;
