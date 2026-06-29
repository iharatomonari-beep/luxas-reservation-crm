-- LUXAS フェーズ3 第7スライス: メール3種（定型文 / 配信履歴 / 自動ルール）= テナント共通・モックのみ
-- 適用順: schema.sql → rls.sql → 最小シード → payment-masters → checkout → retail → daily → menu-extras → tags → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提に seed（定型文2・自動ルール1）。配信履歴は seed なし。
-- ★方針: アプリ側で空になり得る列は NULL 許容。実送信/外部連携/依存追加なし。

-- ============================================================
-- 1. mail_templates（テナント共通マスタ）
-- ============================================================
create table if not exists public.mail_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 未使用（NULL許容）
  name text not null,
  subject text,                                                   -- 空可（NULL許容）
  body text,                                                      -- 空可（NULL許容）
  kind text not null,                                             -- broadcast/edm/reminder/thanks/other（enum制約なし）
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_mail_templates_legacy_id on public.mail_templates(legacy_id);
create index if not exists idx_mail_templates_tenant on public.mail_templates(tenant_id);
drop trigger if exists trg_mail_templates_updated_at on public.mail_templates;
create trigger trg_mail_templates_updated_at before update on public.mail_templates
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. mail_deliveries（テナント共通・配信履歴）
-- ============================================================
create table if not exists public.mail_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  sent_at timestamptz not null,
  template_id uuid references public.mail_templates(id) on delete set null,  -- legacy→uuid解決（NULL許容）
  template_legacy_id text,                                        -- round-trip用（アプリの templateId）
  template_name text,                                             -- 配信時スナップショット（空可）
  subject text,
  kind text,
  target_count integer not null default 0,
  recipient_ids jsonb not null default '[]'::jsonb,              -- 顧客legacy ID配列（顧客はフェーズ4・解決なし）
  status text,
  note text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_mail_deliveries_legacy_id on public.mail_deliveries(legacy_id);
create index if not exists idx_mail_deliveries_tenant_sent on public.mail_deliveries(tenant_id, sent_at desc);
drop trigger if exists trg_mail_deliveries_updated_at on public.mail_deliveries;
create trigger trg_mail_deliveries_updated_at before update on public.mail_deliveries
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. mail_auto_rules（テナント共通マスタ）
-- ============================================================
create table if not exists public.mail_auto_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  name text not null,
  trigger text not null,                                          -- after_visit/birthday/no_visit_days/reservation_reminder
  template_id uuid references public.mail_templates(id) on delete set null,  -- legacy→uuid解決（NULL許容）
  template_legacy_id text,                                        -- round-trip用
  target_note text,                                              -- 空可（NULL許容）
  is_simple boolean not null default false,
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_mail_auto_rules_legacy_id on public.mail_auto_rules(legacy_id);
create index if not exists idx_mail_auto_rules_tenant on public.mail_auto_rules(tenant_id);
drop trigger if exists trg_mail_auto_rules_updated_at on public.mail_auto_rules;
create trigger trg_mail_auto_rules_updated_at before update on public.mail_auto_rules
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. RLS（3テーブルともテナント単位: 参照=スタッフ全員 / 変更=owner・manager）
-- ============================================================
alter table public.mail_templates enable row level security;
drop policy if exists mail_templates_select on public.mail_templates;
create policy mail_templates_select on public.mail_templates for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists mail_templates_write on public.mail_templates;
create policy mail_templates_write on public.mail_templates for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

alter table public.mail_deliveries enable row level security;
drop policy if exists mail_deliveries_select on public.mail_deliveries;
create policy mail_deliveries_select on public.mail_deliveries for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists mail_deliveries_write on public.mail_deliveries;
create policy mail_deliveries_write on public.mail_deliveries for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

alter table public.mail_auto_rules enable row level security;
drop policy if exists mail_auto_rules_select on public.mail_auto_rules;
create policy mail_auto_rules_select on public.mail_auto_rules for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists mail_auto_rules_write on public.mail_auto_rules;
create policy mail_auto_rules_write on public.mail_auto_rules for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- ============================================================
-- 5. seed: 定型文2件・自動ルール1件（冪等・テナント=株式会社東邦）。配信履歴は seed なし。
-- ============================================================
insert into public.mail_templates (legacy_id, tenant_id, name, subject, body, kind, is_active)
select v.legacy_id, t.id, v.name, v.subject, v.body, v.kind, true
from public.tenants t
cross join (values
  ('mail-tpl-001', '新メニューのご案内', '【LUXAS】新しい施術メニューのご案内', E'いつもご利用ありがとうございます。\n新メニューが登場しました。ぜひご予約ください。', 'broadcast'),
  ('mail-tpl-002', 'ご来店ありがとうございました', '【LUXAS】ご来店ありがとうございました', E'本日はご来店いただきありがとうございました。\nまたのご予約をお待ちしております。', 'thanks')
) as v(legacy_id, name, subject, body, kind)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;

insert into public.mail_auto_rules (legacy_id, tenant_id, name, trigger, template_id, template_legacy_id, target_note, is_simple, is_active)
select 'mail-rule-001', t.id, '来店翌日サンクスメール', 'after_visit',
       (select id from public.mail_templates where legacy_id = 'mail-tpl-002' and tenant_id = t.id),
       'mail-tpl-002', '前日に来店（会計済）の顧客', true, false
from public.tenants t
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
