-- LUXAS フェーズ4 S4: RLS本番強度化 — tenant_id を NOT NULL 化
-- 前提（実DBで2026-06-29に確認済み）:
--  - tenant_id を持つ全テーブルで null = 0 件 → バックフィル不要・NOT NULL 化が安全。
--  - ★テナント共通マスタの store_id は全行 null（設計どおり）＝ここでは触らない（NOT NULL にしない）。
--  - store_id を持つ店舗スコープ表は既に schema で NOT NULL（null=0 を確認）。
--
-- 安全策:
--  - 1トランザクション（begin/commit）で all-or-nothing。途中で1件でも null があれば全体ロールバック。
--  - SET NOT NULL は対象列をスキャンして null が無いことを検証してから適用（null があればエラーで停止）。
--  - 既に NOT NULL の列に対しては no-op。
--  - rls.sql の方針「tenant_id はまず nullable で追加 → 後で NOT NULL 化」をここで実施する。

begin;

-- 組織・ユーザー系
alter table public.areas                    alter column tenant_id set not null;
alter table public.stores                   alter column tenant_id set not null;
alter table public.users                    alter column tenant_id set not null;

-- 中核マスタ／予約
alter table public.staff                    alter column tenant_id set not null;
alter table public.services                 alter column tenant_id set not null;
alter table public.rooms                    alter column tenant_id set not null;
alter table public.shifts                   alter column tenant_id set not null;
alter table public.reservations             alter column tenant_id set not null;
alter table public.reservation_resources    alter column tenant_id set not null;

-- 顧客・監査
alter table public.customers                alter column tenant_id set not null;
alter table public.customer_notes           alter column tenant_id set not null;
alter table public.audit_logs               alter column tenant_id set not null;

-- 決済・会計・物販
alter table public.credit_card_companies    alter column tenant_id set not null;
alter table public.emoney_brands            alter column tenant_id set not null;
alter table public.checkout_items           alter column tenant_id set not null;
alter table public.register_records         alter column tenant_id set not null;
alter table public.retail_categories        alter column tenant_id set not null;
alter table public.retail_items             alter column tenant_id set not null;
alter table public.retail_sales             alter column tenant_id set not null;
alter table public.expense_accounts         alter column tenant_id set not null;
alter table public.expense_entries          alter column tenant_id set not null;

-- 日次運用
alter table public.attendance               alter column tenant_id set not null;
alter table public.daily_reports            alter column tenant_id set not null;
alter table public.daily_targets            alter column tenant_id set not null;

-- 商品拡張・タグ
alter table public.menu_categories          alter column tenant_id set not null;
alter table public.service_options          alter column tenant_id set not null;
alter table public.course_sets              alter column tenant_id set not null;
alter table public.master_tags              alter column tenant_id set not null;

-- メール・シフト拡張
alter table public.mail_templates           alter column tenant_id set not null;
alter table public.mail_deliveries          alter column tenant_id set not null;
alter table public.mail_auto_rules          alter column tenant_id set not null;
alter table public.shift_patterns           alter column tenant_id set not null;
alter table public.shift_templates          alter column tenant_id set not null;

-- 小マスタ・設定・取込
alter table public.online_blocks            alter column tenant_id set not null;
alter table public.turnaways                alter column tenant_id set not null;
alter table public.data_errors              alter column tenant_id set not null;
alter table public.user_directory           alter column tenant_id set not null;
alter table public.epark_settings           alter column tenant_id set not null;
alter table public.store_settings           alter column tenant_id set not null;
alter table public.import_jobs              alter column tenant_id set not null;

commit;
