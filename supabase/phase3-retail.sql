-- LUXAS フェーズ3 第3スライス: 物販（カテゴリ retail_categories / 商品 retail_items / 販売 retail_sales）
-- 適用順: schema.sql → rls.sql → 最小シード → phase3-payment-masters.sql → phase3-checkout.sql → このファイル。
-- 冪等（再実行安全）。テナント = 株式会社東邦 を前提に seed（カテゴリ6件・商品62件）。販売は seed なし。
-- ★方針: アプリ側で空になり得る列は NULL 許容（reservations.room_id の NOT NULL 事故の再発防止）。

-- ============================================================
-- 1. retail_categories（テナント共通マスタ）
-- ============================================================
create table if not exists public.retail_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- テナント共通で未使用（NULL許容）
  name text not null,
  short_name text,                                                -- 任意（NULL許容）
  sort_order integer not null default 0,
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_retail_categories_legacy_id on public.retail_categories(legacy_id);
create index if not exists idx_retail_categories_tenant on public.retail_categories(tenant_id);
drop trigger if exists trg_retail_categories_updated_at on public.retail_categories;
create trigger trg_retail_categories_updated_at before update on public.retail_categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. retail_items（テナント共通マスタ）
-- ============================================================
create table if not exists public.retail_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- テナント共通で未使用（NULL許容）
  name text not null,
  category text,                                                  -- カテゴリ名（文字列・空になり得る＝NULL許容）
  price integer not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_retail_items_legacy_id on public.retail_items(legacy_id);
create index if not exists idx_retail_items_tenant on public.retail_items(tenant_id);
drop trigger if exists trg_retail_items_updated_at on public.retail_items;
create trigger trg_retail_items_updated_at before update on public.retail_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. retail_sales（店舗別トランザクション）
-- ============================================================
create table if not exists public.retail_sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,   -- 店舗scope（NULL許容・mapperは既定店舗に解決）
  sale_date date not null,
  customer_name text,                                             -- 任意空可（NULL許容）
  retail_item_id uuid references public.retail_items(id) on delete set null,  -- legacy→uuid解決（NULL許容＝未解決でも拒否しない）
  retail_item_legacy_id text,                                     -- round-trip用（アプリの retailItemId 復元）
  quantity integer not null default 0,
  unit_price integer not null default 0,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_retail_sales_legacy_id on public.retail_sales(legacy_id);
create index if not exists idx_retail_sales_store_date on public.retail_sales(store_id, sale_date);
drop trigger if exists trg_retail_sales_updated_at on public.retail_sales;
create trigger trg_retail_sales_updated_at before update on public.retail_sales
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. RLS
-- ============================================================
-- カテゴリ/商品（テナント単位）: 参照=スタッフ全員 / 変更=owner・manager
alter table public.retail_categories enable row level security;
drop policy if exists retail_categories_select on public.retail_categories;
create policy retail_categories_select on public.retail_categories for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists retail_categories_write on public.retail_categories;
create policy retail_categories_write on public.retail_categories for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

alter table public.retail_items enable row level security;
drop policy if exists retail_items_select on public.retail_items;
create policy retail_items_select on public.retail_items for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );
drop policy if exists retail_items_write on public.retail_items;
create policy retail_items_write on public.retail_items for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );

-- 販売（店舗単位）: 参照・書込=自店舗スタッフ全員
alter table public.retail_sales enable row level security;
drop policy if exists retail_sales_rw on public.retail_sales;
create policy retail_sales_rw on public.retail_sales for all to authenticated
  using ( store_id in (select public.app_user_store_ids()) )
  with check ( store_id in (select public.app_user_store_ids()) );

-- ============================================================
-- 5. seed: カテゴリ／商品（冪等・テナント=株式会社東邦）。販売は seed なし。
-- ============================================================
insert into public.retail_categories (legacy_id, tenant_id, short_name, name, sort_order, is_active)
select v.legacy_id, t.id, v.short_name, v.name, v.sort_order, true
from public.tenants t
cross join (values
  ('retail-cat-pm-0001', null::text, 'シャンプーギフト券', 10),
  ('retail-cat-pm-0002', null::text, 'ポイントカード再発行手数料', 20),
  ('retail-cat-pm-0003', null::text, '受付', 30),
  ('retail-cat-pm-0004', null::text, '整体ギフト券', 40),
  ('retail-cat-pm-0005', null::text, '天使の輪&天使の羽', 50),
  ('retail-cat-pm-0006', null::text, '物販', 60)
) as v(legacy_id, short_name, name, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;

insert into public.retail_items (legacy_id, tenant_id, name, category, price, sort_order, is_active)
select v.legacy_id, t.id, v.name, v.category, v.price, v.sort_order, true
from public.tenants t
cross join (values
  ('retail-pm-0001', 'シャンプーギフト券', 'シャンプーギフト券', 3300, 10),
  ('retail-pm-0002', '眼精スパギフト券', 'シャンプーギフト券', 9900, 20),
  ('retail-pm-0003', '深層ギフト券', 'シャンプーギフト券', 13200, 30),
  ('retail-pm-0004', '夢スパギフト券', 'シャンプーギフト券', 5500, 40),
  ('retail-pm-0005', 'ポイントカード再発行', 'ポイントカード再発行手数料', 200, 50),
  ('retail-pm-0006', '受付', '受付', 0, 60),
  ('retail-pm-0007', '整体60分ギフト券', '整体ギフト券', 6820, 70),
  ('retail-pm-0008', '天使初回シャンプーセット　オレンジ', '天使の輪&天使の羽', 6160, 80),
  ('retail-pm-0009', '天使初回シャンプーセット　ピンク', '天使の輪&天使の羽', 6600, 90),
  ('retail-pm-0010', '+Pエアパス120', '物販', 11880, 100),
  ('retail-pm-0011', '１５周年記念クーポン', '物販', 600, 110),
  ('retail-pm-0012', '2回目チケットシャンプー', '物販', 2300, 120),
  ('retail-pm-0013', '2回目チケット眼精疲労スパ', '物販', 8900, 130),
  ('retail-pm-0014', '2回目チケット深層', '物販', 12200, 140),
  ('retail-pm-0015', '2回目チケット夢', '物販', 4500, 150),
  ('retail-pm-0016', 'GW福袋60分×3', '物販', 16500, 160),
  ('retail-pm-0017', 'LINE@抽選梅昆布茶', '物販', 0, 170),
  ('retail-pm-0018', 'インバウンド105', '物販', 10780, 180),
  ('retail-pm-0019', 'インバウンド105', '物販', 11935, 190),
  ('retail-pm-0020', 'インバウンド120', '物販', 12320, 200),
  ('retail-pm-0021', 'インバウンド120', '物販', 13640, 210),
  ('retail-pm-0022', 'インバウンド30', '物販', 3080, 220),
  ('retail-pm-0023', 'インバウンド30', '物販', 3410, 230),
  ('retail-pm-0024', 'インバウンド45', '物販', 4620, 240),
  ('retail-pm-0025', 'インバウンド45', '物販', 5115, 250),
  ('retail-pm-0026', 'インバウンド60', '物販', 6160, 260),
  ('retail-pm-0027', 'インバウンド60', '物販', 6820, 270),
  ('retail-pm-0028', 'インバウンド75', '物販', 7700, 280),
  ('retail-pm-0029', 'インバウンド75', '物販', 8525, 290),
  ('retail-pm-0030', 'インバウンド90', '物販', 9240, 300),
  ('retail-pm-0031', 'インバウンド90', '物販', 10230, 310),
  ('retail-pm-0032', 'インバウンド頭ほぐし', '物販', 1980, 320),
  ('retail-pm-0033', 'インバウンド頭ほぐし15分', '物販', 2365, 330),
  ('retail-pm-0034', 'オイル', '物販', 3388, 340),
  ('retail-pm-0035', 'シャンプー', '物販', 4620, 350),
  ('retail-pm-0036', 'シンプリス10回', '物販', 36940, 360),
  ('retail-pm-0037', 'シンプリス5回', '物販', 22740, 370),
  ('retail-pm-0038', 'スプリナージュ５回ピンク', '物販', 20600, 380),
  ('retail-pm-0039', 'スプリナージュSHピンク', '物販', 3300, 390),
  ('retail-pm-0040', 'スプリナージュshピンク大￥5500', '物販', 5500, 400),
  ('retail-pm-0041', 'スプリナージュTRピンク', '物販', 3300, 410),
  ('retail-pm-0042', 'スプリナージュシャンプー', '物販', 3080, 420),
  ('retail-pm-0043', 'スプリナージュトリートメント', '物販', 3080, 430),
  ('retail-pm-0044', 'スプリナージュトリートメント10回', '物販', 37980, 440),
  ('retail-pm-0045', 'スプリナージュトリートメント5回', '物販', 23780, 450),
  ('retail-pm-0046', 'スプリナージュミストピンク', '物販', 3300, 460),
  ('retail-pm-0047', 'トリートメント', '物販', 4620, 470),
  ('retail-pm-0048', 'ミント10回', '物販', 34980, 480),
  ('retail-pm-0049', 'ミント5回', '物販', 20780, 490),
  ('retail-pm-0050', 'ミントシャンプー', '物販', 2156, 500),
  ('retail-pm-0051', 'ミントベル', '物販', 1980, 510),
  ('retail-pm-0052', '甘酒', '物販', 800, 520),
  ('retail-pm-0053', '金曜日のシャンプー', '物販', 3960, 530),
  ('retail-pm-0054', '新春福袋', '物販', 15000, 540),
  ('retail-pm-0055', '新春福袋60分×3', '物販', 16500, 550),
  ('retail-pm-0056', '冬福10回　￥36300', '物販', 36300, 560),
  ('retail-pm-0057', '冬福5回　￥22100', '物販', 22100, 570),
  ('retail-pm-0058', '梅昆布茶(3缶セット)', '物販', 1700, 580),
  ('retail-pm-0059', '梅昆布茶（3缶セット）', '物販', 1700, 590),
  ('retail-pm-0060', '梅昆布茶(単品)', '物販', 600, 600),
  ('retail-pm-0061', '梅昆布茶（単品）', '物販', 600, 610),
  ('retail-pm-0062', '梅昆布茶１缶', '物販', 600, 620)
) as v(legacy_id, name, category, price, sort_order)
where t.name = '株式会社東邦'
on conflict (legacy_id) do nothing;
