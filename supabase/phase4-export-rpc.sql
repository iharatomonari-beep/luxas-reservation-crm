-- LUXAS フェーズ4 S3: 顧客CSVエクスポートの owner 限定
-- 適用順: … → phase4-customers.sql → phase4-audit-rpc.sql → このファイル。
-- 冪等（create or replace）。新テーブルなし。log_audit（S2）に依存。
--
-- 設計（§6オーナー判断）:
--  (a) UI用: app_is_owner() … 現在ロールが owner か（auth から判定）。クライアントのボタン表示制御に使う。
--  (b) サーバー強制: export_customers() … ★owner でなければ raise。UIを迂回しても non-owner は1行も取得できない。
--      出力成功時に log_audit('export','customer_csv', {count, fields}) を内部で必ず記録（fields は列名のみ＝PIIなし）。
--  - actor/role/tenant は auth から解決（クライアント偽装不可）。

-- ============================================================
-- (a) owner 判定（UI表示用）
-- ============================================================
create or replace function public.app_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_has_role(array['owner'])
$$;

revoke all on function public.app_is_owner() from public;
grant execute on function public.app_is_owner() to authenticated;

-- ============================================================
-- (b) 顧客一括エクスポート（★owner限定・サーバー強制＋監査記録）
--     返り値は CSV 用の列（PII本体＝owner だけが取得できる）。
-- ============================================================
create or replace function public.export_customers()
returns table (
  name text,
  name_kana text,
  phone text,
  email text,
  birth_date text,
  gender text,
  address text,
  first_visit_date text,
  last_visit_date text,
  caution text,
  chart_memo text,
  tags text[],
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_count  int;
begin
  -- ★owner 強制。UI を迂回しても non-owner は拒否される。
  if not public.app_has_role(array['owner']) then
    raise exception 'export_customers: owner role required';
  end if;
  v_tenant := public.app_user_tenant_id();

  -- ★出力は必ず監査記録（fields は列名のみ・件数のみ＝PII本文は残さない）。
  select count(*) into v_count from public.customers c where c.tenant_id = v_tenant;
  perform public.log_audit(
    'export', 'customer_csv', null,
    jsonb_build_object(
      'count', v_count,
      'fields', jsonb_build_array(
        'name','nameKana','phone','email','birthDate','gender','address',
        'firstVisitDate','lastVisitDate','caution','chartMemo','tags','isActive'
      ),
      'source', 'export_customers'
    ),
    'success'
  );

  return query
    select
      c.name,
      c.name_kana,
      c.phone,
      c.email,
      c.birth_date::text,
      c.gender,
      c.address,
      (c.profile->>'firstVisitDate'),
      (c.profile->>'lastVisitDate'),
      c.caution,
      c.chart_memo,
      c.tags,
      c.is_active
    from public.customers c
    where c.tenant_id = v_tenant
    order by c.name;
end;
$$;

revoke all on function public.export_customers() from public;
grant execute on function public.export_customers() to authenticated;
