-- LUXAS フェーズ4 拡張: ② 顧客マージ（重複統合）の owner限定RPC
-- 適用順: … → phase4-customers.sql → phase4-audit-rpc.sql → phase4-export-rpc.sql → このファイル。
-- 冪等（create or replace / add column if not exists）。★非破壊（行削除なし）。
-- 仕組み: 重複顧客に merged_into_legacy=主(primary) を付与し is_active=false にする（ソフト統合・復元可）。
--
-- 設計:
--  (1) merged_into_legacy 列 … サーバー所有。値があれば「主へ統合済みの重複」（アプリ一覧の非表示候補）。
--      アプリの保存(mapper.toRow)はこの列を書かない＝RPCの設定を誤って上書きしない。
--  (2) merge_customers()  … ★owner限定（サーバー強制）。UIを迂回しても non-owner は拒否。監査記録（PIIなし）。
--  (3) unmerge_customers() … ★owner限定。統合を解除して復元。
--  - actor/role/tenant は auth から解決（クライアント偽装不可）。log_audit(S2) に依存。
--
-- ★運用ゲート: 実顧客の実マージは §5 #6(バックアップ/PITR)・#8(個人情報の専門家確認) 完了後にのみ行う。
--   それまでは架空データでの動作確認に留める。

-- ============================================================
-- (1) 統合先ポインタ列（サーバー所有・nullable）
-- ============================================================
alter table public.customers
  add column if not exists merged_into_legacy text;

create index if not exists idx_customers_merged_into
  on public.customers (merged_into_legacy)
  where merged_into_legacy is not null;

-- ============================================================
-- (2) マージ実行（★owner限定・サーバー強制＋監査記録・非破壊）
--     duplicate群に merged_into_legacy=primary を付与し is_active=false。
--     主(primary)自身・別テナント・既に同じ主へ統合済みは対象外。
-- ============================================================
create or replace function public.merge_customers(
  p_primary_legacy    text,
  p_duplicate_legacys text[],
  p_reason            text default null
)
returns integer
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
    raise exception 'merge_customers: owner role required';
  end if;
  v_tenant := public.app_user_tenant_id();

  -- 主(primary)は同一テナントに実在し、かつ未統合であること（重複を重複へ統合させない）。
  if not exists (
    select 1 from public.customers c
    where c.tenant_id = v_tenant
      and c.legacy_id = p_primary_legacy
      and c.merged_into_legacy is null
  ) then
    raise exception 'merge_customers: primary not found or already merged (%)', p_primary_legacy;
  end if;

  -- duplicate を統合（主自身は除外・同一テナントのみ・既に同じ主へ統合済みは二重カウントしない）。
  update public.customers c
     set merged_into_legacy = p_primary_legacy,
         is_active          = false
   where c.tenant_id = v_tenant
     and c.legacy_id = any(p_duplicate_legacys)
     and c.legacy_id <> p_primary_legacy
     and (c.merged_into_legacy is distinct from p_primary_legacy);
  get diagnostics v_count = row_count;

  -- 監査（★PIIなし＝件数/理由/ソースのみ。氏名/電話/カルテ本文は保存されない）。
  -- target_id は主の legacy_id（log_audit が customers.id へ解決）。
  perform public.log_audit(
    'merge', 'customer', p_primary_legacy,
    jsonb_build_object('count', v_count, 'reason', coalesce(p_reason, ''), 'source', 'merge_customers'),
    'success'
  );

  return v_count;
end;
$$;

revoke all on function public.merge_customers(text, text[], text) from public;
grant execute on function public.merge_customers(text, text[], text) to authenticated;

-- ============================================================
-- (3) マージ復元（★owner限定）。merged_into_legacy=null＋is_active=true へ戻す。
--     ※統合前から非アクティブだった顧客も true に戻る点に注意（必要なら個別に再調整）。
-- ============================================================
create or replace function public.unmerge_customers(
  p_legacys text[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_count  int;
begin
  if not public.app_has_role(array['owner']) then
    raise exception 'unmerge_customers: owner role required';
  end if;
  v_tenant := public.app_user_tenant_id();

  update public.customers c
     set merged_into_legacy = null,
         is_active          = true
   where c.tenant_id = v_tenant
     and c.legacy_id = any(p_legacys)
     and c.merged_into_legacy is not null;
  get diagnostics v_count = row_count;

  perform public.log_audit(
    'unmerge', 'customer', null,
    jsonb_build_object('count', v_count, 'source', 'unmerge_customers'),
    'success'
  );

  return v_count;
end;
$$;

revoke all on function public.unmerge_customers(text[]) from public;
grant execute on function public.unmerge_customers(text[]) to authenticated;
