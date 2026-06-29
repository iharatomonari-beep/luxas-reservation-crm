-- LUXAS フェーズ3 第5スライス: 商品まわり拡張
--   menu_categories(メニューカテゴリ) / service_options(オプション) / course_sets(セット商品)
-- 適用順: schema.sql → rls.sql → 最小シード → payment-masters → checkout → retail → daily → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提に seed（カテゴリ14・オプション236・セット2）。
-- ★方針: アプリ側で空になり得る列は NULL 許容。3つとも参照なしのテナント共通マスタ（fee-master同型）。

-- ============================================================
-- 1. menu_categories（テナント共通）
-- ============================================================
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- テナント共通で未使用（NULL許容）
  name text not null,
  color text,                                                     -- 色キー（空可・NULL許容）
  sort_order integer not null default 0,
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_menu_categories_legacy_id on public.menu_categories(legacy_id);
create index if not exists idx_menu_categories_tenant on public.menu_categories(tenant_id);
drop trigger if exists trg_menu_categories_updated_at on public.menu_categories;
create trigger trg_menu_categories_updated_at before update on public.menu_categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. service_options（テナント共通）
-- ============================================================
create table if not exists public.service_options (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  name text not null,
  category text,                                                  -- カテゴリ名（空可・NULL許容）
  price integer not null default 0,
  sort_order integer not null default 0,
  online_bookable boolean not null default false,
  kind text not null,                                             -- extension/discount/other（enum制約なし）
  extension_minutes integer,                                      -- 任意（NULL許容）
  discount_percent integer,                                       -- 任意（NULL許容）
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_service_options_legacy_id on public.service_options(legacy_id);
create index if not exists idx_service_options_tenant on public.service_options(tenant_id);
drop trigger if exists trg_service_options_updated_at on public.service_options;
create trigger trg_service_options_updated_at before update on public.service_options
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. course_sets（テナント共通・フラット商品・メニュー参照なし）
-- ============================================================
create table if not exists public.course_sets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  name text not null,
  category text,                                                  -- 空可（NULL許容）
  price integer not null default 0,
  sort_order integer not null default 0,
  online_booking boolean,                                         -- 任意（NULL許容）
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_course_sets_legacy_id on public.course_sets(legacy_id);
create index if not exists idx_course_sets_tenant on public.course_sets(tenant_id);
drop trigger if exists trg_course_sets_updated_at on public.course_sets;
create trigger trg_course_sets_updated_at before update on public.course_sets
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. RLS（3テーブルともテナント単位: 参照=スタッフ全員 / 変更=owner・manager）
-- ============================================================
alter table public.menu_categories enable row level security;
drop policy if exists menu_categories_select on public.menu_categories;
create policy menu_categories_select on public.menu_categories for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists menu_categories_write on public.menu_categories;
create policy menu_categories_write on public.menu_categories for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

alter table public.service_options enable row level security;
drop policy if exists service_options_select on public.service_options;
create policy service_options_select on public.service_options for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists service_options_write on public.service_options;
create policy service_options_write on public.service_options for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

alter table public.course_sets enable row level security;
drop policy if exists course_sets_select on public.course_sets;
create policy course_sets_select on public.course_sets for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists course_sets_write on public.course_sets;
create policy course_sets_write on public.course_sets for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- ============================================================
-- 5. seed（冪等・テナント=株式会社東邦）
-- ============================================================
insert into public.menu_categories (legacy_id, tenant_id, name, color, sort_order, is_active)
select v.legacy_id, t.id, v.name, v.color, v.sort_order, true
from public.tenants t
cross join (values
  ('category-pm-001', 'ボディケア', 'green', 10),
  ('category-pm-002', 'ヘッド・頭ほぐし', 'violet', 20),
  ('category-pm-003', '特別・スペシャル', 'rose', 30),
  ('category-pm-004', '寄附金付き', 'amber', 40),
  ('category-pm-005', 'インバウンド', 'sky', 50),
  ('category-pm-006', '外国人向け', 'teal', 60),
  ('category-pm-007', 'マタニティ', 'pink', 70),
  ('category-pm-008', '鍼', 'stone', 80),
  ('category-pm-009', 'シャンプー', 'sky', 90),
  ('category-pm-010', '出張', 'teal', 100),
  ('category-pm-011', 'HPB', 'amber', 110),
  ('category-pm-012', 'ClassPass', 'violet', 120),
  ('category-pm-013', 'TORICOM', 'stone', 130),
  ('category-pm-014', 'その他', 'stone', 140)
) as v(legacy_id, name, color, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;

insert into public.service_options (legacy_id, tenant_id, name, category, price, sort_order, online_bookable, kind, extension_minutes, discount_percent, is_active)
select v.legacy_id, t.id, v.name, v.category, v.price, v.sort_order, v.online_bookable, v.kind, v.extension_minutes, v.discount_percent, true
from public.tenants t
cross join (values
  ('option-pm-0001', '15分延長', '共通', 1400, 10, true, 'extension', 15, null::int),
  ('option-pm-0002', 'C延長15分', '共通', 1705, 20, false, 'extension', 15, null::int),
  ('option-pm-0003', 'C延長１５分', '共通', 1705, 30, false, 'extension', 15, null::int),
  ('option-pm-0004', 'C延長15分', '共通', 1815, 40, false, 'extension', 15, null::int),
  ('option-pm-0005', 'C鍼延長15分', '共通', 2145, 50, false, 'extension', 15, null::int),
  ('option-pm-0006', '延長105分', '共通', 9800, 60, false, 'extension', 105, null::int),
  ('option-pm-0007', '延長15分', '共通', 1400, 70, false, 'extension', 15, null::int),
  ('option-pm-0008', '延長１５分', '共通', 1400, 80, false, 'extension', 15, null::int),
  ('option-pm-0009', '延長１５分', '共通', 1650, 90, false, 'extension', 15, null::int),
  ('option-pm-0010', '延長15分', '共通', 1540, 100, false, 'extension', 15, null::int),
  ('option-pm-0011', '延長15分', '共通', 1650, 110, false, 'extension', 15, null::int),
  ('option-pm-0012', '延長15分', '共通', 1705, 120, false, 'extension', 15, null::int),
  ('option-pm-0013', '延長15分', '共通', 1815, 130, false, 'extension', 15, null::int),
  ('option-pm-0014', '延長20分', '共通', 0, 140, false, 'extension', 20, null::int),
  ('option-pm-0015', '延長30分', '共通', 2800, 150, false, 'extension', 30, null::int),
  ('option-pm-0016', '延長３０分', '共通', 2800, 160, false, 'extension', 30, null::int),
  ('option-pm-0017', '延長３０分', '共通', 3300, 170, false, 'extension', 30, null::int),
  ('option-pm-0018', '延長30分', '共通', 3080, 180, false, 'extension', 30, null::int),
  ('option-pm-0019', '延長30分', '共通', 3300, 190, false, 'extension', 30, null::int),
  ('option-pm-0020', '延長30分', '共通', 3410, 200, false, 'extension', 30, null::int),
  ('option-pm-0021', '延長30分', '共通', 3630, 210, false, 'extension', 30, null::int),
  ('option-pm-0022', '延長45分', '共通', 4200, 220, true, 'extension', 45, null::int),
  ('option-pm-0023', '延長60分', '共通', 5600, 230, false, 'extension', 60, null::int),
  ('option-pm-0024', '延長60分', '共通', 6160, 240, false, 'extension', 60, null::int),
  ('option-pm-0025', '延長60分', '共通', 6820, 250, false, 'extension', 60, null::int),
  ('option-pm-0026', '延長75分', '共通', 7000, 260, true, 'extension', 73, null::int),
  ('option-pm-0027', '肩揉み5分延長', '共通', 550, 270, false, 'extension', 5, null::int),
  ('option-pm-0028', '鍼延長15分', '共通', 1925, 280, false, 'extension', 15, null::int),
  ('option-pm-0029', '鍼延長15分', '共通', 2145, 290, false, 'extension', 15, null::int),
  ('option-pm-0030', '12月限定LINE50%OFFクーポン', '共通', 0, 300, false, 'discount', null::int, 50),
  ('option-pm-0031', '16周年10%', '共通', 0, 310, false, 'discount', null::int, 10),
  ('option-pm-0032', '20周年10%引全コース', '共通', 0, 320, false, 'discount', null::int, 10),
  ('option-pm-0033', '20周年LINE10%引', '共通', 0, 330, false, 'discount', null::int, 10),
  ('option-pm-0034', '20代10%OFF', '共通', 0, 340, false, 'discount', null::int, 10),
  ('option-pm-0035', '2回目10%off', '共通', 0, 350, false, 'discount', null::int, 10),
  ('option-pm-0036', '２回目10%off', '共通', 0, 360, false, 'discount', null::int, 10),
  ('option-pm-0037', '2重10%', '共通', 0, 370, false, 'discount', null::int, 10),
  ('option-pm-0038', '5%キャンペーン', '共通', 0, 380, false, 'discount', null::int, 5),
  ('option-pm-0039', 'APスタンプ10%', '共通', 0, 390, false, 'discount', null::int, 10),
  ('option-pm-0040', 'APスタンプ10％', '共通', 0, 400, false, 'discount', null::int, 10),
  ('option-pm-0041', 'GMB10%', '共通', 0, 410, false, 'discount', null::int, 10),
  ('option-pm-0042', 'GMB10％', '共通', 0, 420, false, 'discount', null::int, 10),
  ('option-pm-0043', 'GMB5%', '共通', 0, 430, false, 'discount', null::int, 5),
  ('option-pm-0044', 'GMB5％', '共通', 0, 440, false, 'discount', null::int, 5),
  ('option-pm-0045', 'HPB10%30日後メール', '共通', 0, 450, false, 'discount', null::int, 10),
  ('option-pm-0046', 'HPB10%60日後メール', '共通', 0, 460, false, 'discount', null::int, 10),
  ('option-pm-0047', 'HPB10%来店3回目クーポン', '共通', 0, 470, false, 'discount', null::int, 10),
  ('option-pm-0048', 'HPB10%来店翌日メール', '共通', 0, 480, false, 'discount', null::int, 10),
  ('option-pm-0049', 'HPB5%口コミ', '共通', 0, 490, false, 'discount', null::int, 5),
  ('option-pm-0050', 'HPB新規10％OFF', '共通', 0, 500, false, 'discount', null::int, 10),
  ('option-pm-0051', 'LINE50%', '共通', 0, 510, false, 'discount', null::int, 50),
  ('option-pm-0052', 'LINE紹介された方10%', '共通', 0, 520, false, 'discount', null::int, 10),
  ('option-pm-0053', 'LINE紹介した方10%', '共通', 0, 530, false, 'discount', null::int, 10),
  ('option-pm-0054', 'SP口コミ整体10％OFF', '共通', 0, 540, false, 'discount', null::int, 10),
  ('option-pm-0055', 'アプリ限定10%', '共通', 0, 550, false, 'discount', null::int, 10),
  ('option-pm-0056', 'ウエルカムチケット10％', '共通', 0, 560, false, 'discount', null::int, 10),
  ('option-pm-0057', 'ウエルカムチケット20％', '共通', 0, 570, false, 'discount', null::int, 20),
  ('option-pm-0058', 'ご新規様次回予約10%割引', '共通', 0, 580, false, 'discount', null::int, 10),
  ('option-pm-0059', 'サマー新規全コース10％オフ', '共通', 0, 590, false, 'discount', null::int, 10),
  ('option-pm-0060', 'セットシャンプー10％', '共通', 0, 600, false, 'discount', null::int, 10),
  ('option-pm-0061', 'チラシ30％', '共通', 0, 610, false, 'discount', null::int, 30),
  ('option-pm-0062', 'ハガキ10%', '共通', 0, 620, false, 'discount', null::int, 10),
  ('option-pm-0063', 'バレンタイン5％', '共通', 0, 630, false, 'discount', null::int, 5),
  ('option-pm-0064', 'バレンタインペア割20%OFF', '共通', 0, 640, false, 'discount', null::int, 20),
  ('option-pm-0065', 'ペア10%', '共通', 0, 650, false, 'discount', null::int, 10),
  ('option-pm-0066', 'ペア10%(夏特)', '共通', 0, 660, true, 'discount', null::int, 10),
  ('option-pm-0067', 'ポス 10%引', '共通', 0, 670, false, 'discount', null::int, 10),
  ('option-pm-0068', 'ポス 5%引', '共通', 0, 680, false, 'discount', null::int, 5),
  ('option-pm-0069', 'マグ10%', '共通', 0, 690, false, 'discount', null::int, 10),
  ('option-pm-0070', 'マグカップ10%', '共通', 0, 700, false, 'discount', null::int, 10),
  ('option-pm-0071', '夏割20%', '共通', 0, 710, false, 'discount', null::int, 20),
  ('option-pm-0072', '夏割新規全コース20％オフ', '共通', 0, 720, false, 'discount', null::int, 20),
  ('option-pm-0073', '夏特10%off', '共通', 0, 730, false, 'discount', null::int, 10),
  ('option-pm-0074', '学生体験20％', '共通', 0, 740, false, 'discount', null::int, 20),
  ('option-pm-0075', '寄付金新規割10%OFF', '共通', 0, 750, false, 'discount', null::int, 10),
  ('option-pm-0076', '寄附金新規10%', '共通', 0, 760, false, 'discount', null::int, 10),
  ('option-pm-0077', '宮下指名割10%', '共通', 0, 770, false, 'discount', null::int, 10),
  ('option-pm-0078', '協会員10%', '共通', 0, 780, false, 'discount', null::int, 10),
  ('option-pm-0079', '協会割10%', '共通', 0, 790, false, 'discount', null::int, 10),
  ('option-pm-0080', '金曜日割20％', '共通', 0, 800, false, 'discount', null::int, 20),
  ('option-pm-0081', '掘り起こし10%', '共通', 0, 810, false, 'discount', null::int, 10),
  ('option-pm-0082', '掘り起こしRUU10％', '共通', 0, 820, false, 'discount', null::int, 10),
  ('option-pm-0083', '肩甲骨10%OFF', '共通', 0, 830, false, 'discount', null::int, 10),
  ('option-pm-0084', '現ナマ特典10%OFF', '共通', 0, 840, false, 'discount', null::int, 10),
  ('option-pm-0085', '現金払い75分以上10％割引', '共通', 0, 850, false, 'discount', null::int, 10),
  ('option-pm-0086', '今月末まで10%off', '共通', 0, 860, false, 'discount', null::int, 10),
  ('option-pm-0087', '三井ガーデン特別20%割引', '共通', 0, 870, false, 'discount', null::int, 20),
  ('option-pm-0088', '次回予約10％', '共通', 0, 880, false, 'discount', null::int, 10),
  ('option-pm-0089', '篠宮祭り10%', '共通', 0, 890, false, 'discount', null::int, 10),
  ('option-pm-0090', '社割20%', '共通', 0, 900, false, 'discount', null::int, 20),
  ('option-pm-0091', '新規10%off', '共通', 0, 910, false, 'discount', null::int, 10),
  ('option-pm-0092', '新規10%引き', '共通', 0, 920, false, 'discount', null::int, 10),
  ('option-pm-0093', '新規20%off', '共通', 0, 930, false, 'discount', null::int, 20),
  ('option-pm-0094', '新規次回来店予約10%OFF', '共通', 0, 940, false, 'discount', null::int, 10),
  ('option-pm-0095', '朝得 5%OFF', '共通', 0, 950, false, 'discount', null::int, 5),
  ('option-pm-0096', '辻井推し10％引', '共通', 0, 960, false, 'discount', null::int, 10),
  ('option-pm-0097', '東口20周年10%引クーポン', '共通', 0, 970, false, 'discount', null::int, 10),
  ('option-pm-0098', '平日限定10%OFF', '共通', 0, 980, false, 'discount', null::int, 10),
  ('option-pm-0099', '崔,宮川祭り指名10%引き', '共通', 0, 990, false, 'discount', null::int, 10),
  ('option-pm-0100', '”XmasSP”10分無料脳リフレ', '共通', 0, 1000, true, 'other', null::int, null::int),
  ('option-pm-0101', '《つゆだく105分》', '共通', 0, 1010, false, 'other', null::int, null::int),
  ('option-pm-0102', '【11月限定価格】オプションヘッドマッサージ', '共通', 1650, 1020, false, 'other', null::int, null::int),
  ('option-pm-0103', '【12月限定価格】オプションヘッドマッサージ', '共通', 1650, 1030, false, 'other', null::int, null::int),
  ('option-pm-0104', '10月ラインクーポン利用', '共通', 0, 1040, false, 'other', null::int, null::int),
  ('option-pm-0105', '11月ラインクーポン利用', '共通', 0, 1050, false, 'other', null::int, null::int),
  ('option-pm-0106', '2022マグカップ頭15分', '共通', 0, 1060, false, 'other', null::int, null::int),
  ('option-pm-0107', '21冬特クーポン', '共通', 0, 1070, false, 'other', null::int, null::int),
  ('option-pm-0108', '2重500円', '共通', 550, 1080, false, 'other', null::int, null::int),
  ('option-pm-0109', '5月病440円off', '共通', 0, 1090, false, 'other', null::int, null::int),
  ('option-pm-0110', 'A看板Xmas初1000', '共通', 0, 1100, false, 'other', null::int, null::int),
  ('option-pm-0111', 'A看板初回割500', '共通', 0, 1110, false, 'other', null::int, null::int),
  ('option-pm-0112', 'Google', '共通', 0, 1120, false, 'other', null::int, null::int),
  ('option-pm-0113', 'Googleで検索', '共通', 0, 1130, false, 'other', null::int, null::int),
  ('option-pm-0114', 'Google検索', '共通', 0, 1140, false, 'other', null::int, null::int),
  ('option-pm-0115', 'HPBポイント利用', '共通', 0, 1150, false, 'other', null::int, null::int),
  ('option-pm-0116', 'HPB口コミ', '共通', 0, 1160, false, 'other', null::int, null::int),
  ('option-pm-0117', 'LINE＠抽選梅昆布茶', '共通', 0, 1170, false, 'other', null::int, null::int),
  ('option-pm-0118', 'LINE5分無料', '共通', 0, 1180, false, 'other', null::int, null::int),
  ('option-pm-0119', 'LINEポイント２倍', '共通', 0, 1190, false, 'other', null::int, null::int),
  ('option-pm-0120', 'LINEポイント5', '共通', 0, 1200, true, 'other', null::int, null::int),
  ('option-pm-0121', 'LINE初回登録', '共通', 0, 1210, false, 'other', null::int, null::int),
  ('option-pm-0122', 'LINE登録もみ家', '共通', 0, 1220, false, 'other', null::int, null::int),
  ('option-pm-0123', 'LINE登録東口5', '共通', 0, 1230, false, 'other', null::int, null::int),
  ('option-pm-0124', 'LINE友ポイント', '共通', 0, 1240, false, 'other', null::int, null::int),
  ('option-pm-0125', 'PayPay', '共通', 0, 1250, false, 'other', null::int, null::int),
  ('option-pm-0126', 'PayPay春キャン', '共通', 0, 1260, false, 'other', null::int, null::int),
  ('option-pm-0127', 'SNS', '共通', 0, 1270, false, 'other', null::int, null::int),
  ('option-pm-0128', 'Wスパシャン', '共通', 1100, 1280, false, 'other', null::int, null::int),
  ('option-pm-0129', 'Xmas 1000', '共通', 0, 1290, false, 'other', null::int, null::int),
  ('option-pm-0130', 'いい夫婦ペア割', '共通', 0, 1300, false, 'other', null::int, null::int),
  ('option-pm-0131', 'インスタ登録もみ家', '共通', 0, 1310, false, 'other', null::int, null::int),
  ('option-pm-0132', 'インスタ登録東口5', '共通', 0, 1320, false, 'other', null::int, null::int),
  ('option-pm-0133', 'エクボクローク', '共通', 0, 1330, false, 'other', null::int, null::int),
  ('option-pm-0134', 'オータムキャンペーン', '共通', 0, 1340, true, 'other', null::int, null::int),
  ('option-pm-0135', 'オプション】温感ヘッドマッサージ15分', '共通', 2365, 1350, true, 'other', null::int, null::int),
  ('option-pm-0136', 'オプションヘッドマッサージ15分', '共通', 1870, 1360, false, 'other', null::int, null::int),
  ('option-pm-0137', 'お試し脳リフレ10分(ハガキ持参の方のみ有効)', '共通', 0, 1370, true, 'other', null::int, null::int),
  ('option-pm-0138', 'カッピング', '共通', 997, 1380, true, 'other', null::int, null::int),
  ('option-pm-0139', 'カッピング', '共通', 1000, 1390, true, 'other', null::int, null::int),
  ('option-pm-0140', 'カッピング', '共通', 1100, 1400, false, 'other', null::int, null::int),
  ('option-pm-0141', 'ゲリラ１０％', '共通', 0, 1410, true, 'other', null::int, null::int),
  ('option-pm-0142', 'ゲリラ75', '共通', 0, 1420, true, 'other', null::int, null::int),
  ('option-pm-0143', 'ご紹介', '共通', 0, 1430, false, 'other', null::int, null::int),
  ('option-pm-0144', 'シークレット割', '共通', 0, 1440, false, 'other', null::int, null::int),
  ('option-pm-0145', 'シャンプー専用　うる艶トリートメント', '共通', 2200, 1450, true, 'other', null::int, null::int),
  ('option-pm-0146', 'シャンプー専用　ダブルシャンプー', '圧倒的シャンプー', 1100, 1460, true, 'other', null::int, null::int),
  ('option-pm-0147', 'シャンプー専用　ミント', '共通', 550, 1470, true, 'other', null::int, null::int),
  ('option-pm-0148', 'シャンプー専用　肩もみケア（5分）', '共通', 550, 1480, true, 'other', null::int, null::int),
  ('option-pm-0149', 'シャンプー専用　炭酸シャンプー', '共通', 1100, 1490, true, 'other', null::int, null::int),
  ('option-pm-0150', 'シルバー１０％', '共通', 0, 1500, false, 'other', null::int, null::int),
  ('option-pm-0151', 'シルバー世代キャンペーン', '共通', 0, 1510, false, 'other', null::int, null::int),
  ('option-pm-0152', 'ストレッチ15分(山口のみ)', '共通', 2365, 1520, false, 'other', null::int, null::int),
  ('option-pm-0153', 'その他', '共通', 0, 1530, false, 'other', null::int, null::int),
  ('option-pm-0154', 'ハガキ１０００', '共通', 0, 1540, false, 'other', null::int, null::int),
  ('option-pm-0155', 'ハガキ５００', '共通', 0, 1550, false, 'other', null::int, null::int),
  ('option-pm-0156', 'フット15分', '共通', 1815, 1560, false, 'other', null::int, null::int),
  ('option-pm-0157', 'フット30分', '共通', 3630, 1570, false, 'other', null::int, null::int),
  ('option-pm-0158', 'フット深層筋クリームケア30', '共通', 4730, 1580, false, 'other', null::int, null::int),
  ('option-pm-0159', 'ペア電話予約', '共通', 0, 1590, false, 'other', null::int, null::int),
  ('option-pm-0160', 'ヘッドクーポン15分無料', '共通', 0, 1600, false, 'other', null::int, null::int),
  ('option-pm-0161', 'ヘッドケア期間限定550', '共通', 0, 1610, false, 'other', null::int, null::int),
  ('option-pm-0162', 'ヘッドマッサージ15分', '共通', 2200, 1620, false, 'other', null::int, null::int),
  ('option-pm-0163', 'ヘッドマッサージ15分', '共通', 2475, 1630, false, 'other', null::int, null::int),
  ('option-pm-0164', 'ポイント15分無料', '共通', 0, 1640, false, 'other', null::int, null::int),
  ('option-pm-0165', 'ポイント30分無料', '共通', 0, 1650, false, 'other', null::int, null::int),
  ('option-pm-0166', 'ポイント出張15分無料', '共通', 0, 1660, false, 'other', null::int, null::int),
  ('option-pm-0167', 'ポイント出張30分無料', '共通', 0, 1670, false, 'other', null::int, null::int),
  ('option-pm-0168', 'ホームページ', '共通', 0, 1680, false, 'other', null::int, null::int),
  ('option-pm-0169', 'ほっと 頭ほぐしop15', '共通', 1980, 1690, false, 'other', null::int, null::int),
  ('option-pm-0170', 'マグカップ', '共通', 0, 1700, false, 'other', null::int, null::int),
  ('option-pm-0171', 'マタニティ', '共通', 0, 1710, true, 'other', null::int, null::int),
  ('option-pm-0172', 'ママのご褒美', '共通', 0, 1720, false, 'other', null::int, null::int),
  ('option-pm-0173', 'レディースデー', '共通', 0, 1730, true, 'other', null::int, null::int),
  ('option-pm-0174', 'レディースデー（無料）', '共通', 0, 1740, false, 'other', null::int, null::int),
  ('option-pm-0175', 'ワンポイント鍼', '共通', 500, 1750, false, 'other', null::int, null::int),
  ('option-pm-0176', 'ワンポイント鍼', '共通', 550, 1760, false, 'other', null::int, null::int),
  ('option-pm-0177', 'ワンポイント鍼', '共通', 660, 1770, false, 'other', null::int, null::int),
  ('option-pm-0178', '回数券　眼精疲労スパ変更', '共通', 6600, 1780, false, 'other', null::int, null::int),
  ('option-pm-0179', '回数券　深層セラピー変更', '共通', 9900, 1790, false, 'other', null::int, null::int),
  ('option-pm-0180', '回数券　夢スパ変更', '共通', 2200, 1800, false, 'other', null::int, null::int),
  ('option-pm-0181', '快眠!!頭ほぐし30分', '共通', 3630, 1810, true, 'other', null::int, null::int),
  ('option-pm-0182', '快眠!!頭ほぐし30分', '共通', 4180, 1820, true, 'other', null::int, null::int),
  ('option-pm-0183', '学生体験', '共通', 0, 1830, false, 'other', null::int, null::int),
  ('option-pm-0184', '看板', '共通', 0, 1840, false, 'other', null::int, null::int),
  ('option-pm-0185', '既存ハガキ1000', '共通', 0, 1850, false, 'other', null::int, null::int),
  ('option-pm-0186', '吉川割１０％', '共通', 0, 1860, false, 'other', null::int, null::int),
  ('option-pm-0187', '錦糸町LINEポイント5', '共通', 0, 1870, false, 'other', null::int, null::int),
  ('option-pm-0188', '月光SP', '共通', 0, 1880, false, 'other', null::int, null::int),
  ('option-pm-0189', '肩もみケア', '圧倒的シャンプー', 550, 1890, false, 'other', null::int, null::int),
  ('option-pm-0190', '肩甲骨５％OFF(平日)', '共通', 0, 1900, false, 'other', null::int, null::int),
  ('option-pm-0191', '個室希望', '共通', 0, 1910, false, 'other', null::int, null::int),
  ('option-pm-0192', '個室料金', '共通', 550, 1920, false, 'other', null::int, null::int),
  ('option-pm-0193', '個室料金', '共通', 660, 1930, false, 'other', null::int, null::int),
  ('option-pm-0194', '呼び込み', '共通', 0, 1940, false, 'other', null::int, null::int),
  ('option-pm-0195', '固定予約', '共通', 0, 1950, false, 'other', null::int, null::int),
  ('option-pm-0196', '指名料', '共通', 0, 1960, false, 'other', null::int, null::int),
  ('option-pm-0197', '次回割引', '共通', 0, 1970, false, 'other', null::int, null::int),
  ('option-pm-0198', '次回予約ヘッド無料￥1650引き（11月・12月）', '共通', 0, 1980, false, 'other', null::int, null::int),
  ('option-pm-0199', '出張費1000', '共通', 1000, 1990, false, 'other', null::int, null::int),
  ('option-pm-0200', '出張費10000', '共通', 10000, 2000, false, 'other', null::int, null::int),
  ('option-pm-0201', '出張費1500', '共通', 1500, 2010, false, 'other', null::int, null::int),
  ('option-pm-0202', '出張費2000', '共通', 2000, 2020, false, 'other', null::int, null::int),
  ('option-pm-0203', '出張費500', '共通', 500, 2030, false, 'other', null::int, null::int),
  ('option-pm-0204', '出張費無料', '共通', 0, 2040, false, 'other', null::int, null::int),
  ('option-pm-0205', '女性希望', '共通', 0, 2050, true, 'other', null::int, null::int),
  ('option-pm-0206', '紹介', '共通', 0, 2060, false, 'other', null::int, null::int),
  ('option-pm-0207', '新規５％', '共通', 0, 2070, false, 'other', null::int, null::int),
  ('option-pm-0208', '新規DM500', '共通', 0, 2080, false, 'other', null::int, null::int),
  ('option-pm-0209', '新規ヘッド15分無料クーポン', '共通', 0, 2090, false, 'other', null::int, null::int),
  ('option-pm-0210', '新規割', '共通', 0, 2100, false, 'other', null::int, null::int),
  ('option-pm-0211', '整体コース専用　頭ほぐし15分', '共通', 1980, 2110, true, 'other', null::int, null::int),
  ('option-pm-0212', '整体希望', '共通', 0, 2120, false, 'other', null::int, null::int),
  ('option-pm-0213', '整体専用頭ほぐし15分', '共通', 2365, 2130, true, 'other', null::int, null::int),
  ('option-pm-0214', '男のリチャージ', '共通', 0, 2140, false, 'other', null::int, null::int),
  ('option-pm-0215', '男性希望', '共通', 0, 2150, true, 'other', null::int, null::int),
  ('option-pm-0216', '堤SP15分', 'ハイブリッド', 3080, 2160, false, 'other', null::int, null::int),
  ('option-pm-0217', '堤SP30分', 'ハイブリッド', 6160, 2170, false, 'other', null::int, null::int),
  ('option-pm-0218', '店舗HP', '共通', 0, 2180, false, 'other', null::int, null::int),
  ('option-pm-0219', '店舗LINE1000', '共通', 0, 2190, false, 'other', null::int, null::int),
  ('option-pm-0220', '店舗LINE500', '共通', 0, 2200, false, 'other', null::int, null::int),
  ('option-pm-0221', '頭ほぐし15', '共通', 1980, 2210, true, 'other', null::int, null::int),
  ('option-pm-0222', '頭ほぐし15分', '＊スペシャルコース＊', 1980, 2220, true, 'other', null::int, null::int),
  ('option-pm-0223', '頭ほぐし15分', '共通', 2365, 2230, true, 'other', null::int, null::int),
  ('option-pm-0224', '頭ほぐし15分（Warming head massage 15min）', '共通', 1980, 2240, true, 'other', null::int, null::int),
  ('option-pm-0225', '頭ほぐし30', '共通', 3960, 2250, false, 'other', null::int, null::int),
  ('option-pm-0226', '頭ほぐし30', '共通', 4070, 2260, false, 'other', null::int, null::int),
  ('option-pm-0227', '脳リフレ', '共通', 1800, 2270, true, 'other', null::int, null::int),
  ('option-pm-0228', '脳リフレ15分', '共通', 1980, 2280, true, 'other', null::int, null::int),
  ('option-pm-0229', '脳リフレ15分', '共通', 2365, 2290, true, 'other', null::int, null::int),
  ('option-pm-0230', '疲労超回復（Treatment using hot pads）', '共通', 550, 2300, true, 'other', null::int, null::int),
  ('option-pm-0231', '疲労超回復A：首肩中心に上半身', '共通', 3200, 2310, true, 'other', null::int, null::int),
  ('option-pm-0232', '疲労超回復B：腰、足を中心に下半身', '共通', 3200, 2320, true, 'other', null::int, null::int),
  ('option-pm-0233', '父の日700', '共通', 7000, 2330, false, 'other', null::int, null::int),
  ('option-pm-0234', '北澤 GO！', '共通', 0, 2340, false, 'other', null::int, null::int),
  ('option-pm-0235', '本格頭ほぐし', '共通', 3300, 2350, false, 'other', null::int, null::int),
  ('option-pm-0236', '有馬記念', '共通', 0, 2360, false, 'other', null::int, null::int)
) as v(legacy_id, name, category, price, sort_order, online_bookable, kind, extension_minutes, discount_percent)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;

insert into public.course_sets (legacy_id, tenant_id, name, category, price, sort_order, online_booking, is_active)
select v.legacy_id, t.id, v.name, v.category, v.price, v.sort_order, v.online_booking, true
from public.tenants t
cross join (values
  ('set-001', 'ボディ+フェイシャル 90分セット', 'セット', 14000, 10, true),
  ('set-002', 'カウンセリング+ボディ 120分セット', 'セット', 17000, 20, false)
) as v(legacy_id, name, category, price, sort_order, online_booking)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
