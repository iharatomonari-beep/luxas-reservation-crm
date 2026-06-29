-- LUXAS フェーズ4 S2: 監査ログ基盤 — definer RPC log_audit()
-- 適用順: schema.sql → rls.sql → 各 phase3-*.sql → phaseA-*.sql → phase4-customers.sql → このファイル。
-- 冪等（create or replace）。★既存 audit_logs テーブルを使う（新テーブルは作らない）。
--
-- 設計（§6オーナー判断 2026-06-28）:
--  - ★actor/role/tenant/store は auth.uid() から SQL 側で解決（クライアントは偽装できない）。
--  - audit_logs への書込は RLS で禁止（insertポリシー無し）。この security definer 関数経由でのみ書ける。
--  - ★PIIガード: detail は「ホワイトリストのキーのみ」採用。氏名・電話・カルテ等の本文は構造的に保存されない。
--      記録するのは「誰が・いつ・どの操作種別を・どの target_id に・結果」＋非PIIメタ（件数/形式/列名 等）まで。
--  - 顧客の target_id は legacy_id（"customer-001" 等）→ customers.id(uuid) に解決して格納。

create or replace function public.log_audit(
  p_action_type text,
  p_target_type text,
  p_target_id   text  default null,
  p_detail      jsonb default '{}'::jsonb,
  p_result      text  default 'success'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tenant  uuid;
  v_role    text;
  v_store   uuid;
  v_target  uuid;
  v_detail  jsonb;
  v_id      uuid;
  v_uuid_re text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  -- ★actor は auth から解決。アプリユーザーでなければ書かせない（anon/偽装を拒否）。
  v_user_id := public.app_current_user_id();
  if v_user_id is null then
    raise exception 'log_audit: not authorized (no active app user)';
  end if;
  v_tenant := public.app_user_tenant_id();

  -- actor_role: owner > manager > その他 の優先で1つ。無ければ 'unknown'。
  select r.role into v_role
  from public.user_roles r
  where r.user_id = v_user_id
  order by case r.role when 'owner' then 0 when 'manager' then 1 else 2 end
  limit 1;
  v_role := coalesce(v_role, 'unknown');

  -- store_id は NOT NULL。actor の所属店舗 → 無ければ自テナントの先頭店舗。
  select u.store_id into v_store from public.users u where u.id = v_user_id;
  if v_store is null then
    select s.id into v_store from public.stores s
    where s.tenant_id = v_tenant order by s.created_at limit 1;
  end if;
  if v_store is null then
    raise exception 'log_audit: no store resolved for actor';
  end if;

  -- target_id: customer は legacy_id → uuid 解決。それ以外は uuid 形式なら採用、非該当は null。
  if p_target_id is null then
    v_target := null;
  elsif p_target_type = 'customer' then
    select c.id into v_target from public.customers c
    where c.legacy_id = p_target_id and c.tenant_id = v_tenant
    limit 1;
    if v_target is null and p_target_id ~ v_uuid_re then
      v_target := p_target_id::uuid;
    end if;
  elsif p_target_id ~ v_uuid_re then
    v_target := p_target_id::uuid;
  else
    v_target := null;
  end if;

  -- ★PIIガード: ホワイトリストのキーのみ。名前/電話/カルテ等の本文は構造的に保存されない。
  --   count=件数 / format=CSV形式名 / fields=列名配列 / changedFields=変更列名配列 / source / mode / reason。
  v_detail := jsonb_strip_nulls(jsonb_build_object(
    'count',         p_detail->'count',
    'format',        p_detail->'format',
    'fields',        p_detail->'fields',
    'changedFields', p_detail->'changedFields',
    'source',        p_detail->'source',
    'mode',          p_detail->'mode',
    'reason',        p_detail->'reason'
  ));

  insert into public.audit_logs (
    tenant_id, store_id, actor_user_id, actor_role,
    action_type, target_type, target_id, detail, result
  ) values (
    v_tenant, v_store, v_user_id, v_role,
    coalesce(p_action_type, 'unknown'),
    coalesce(p_target_type, 'unknown'),
    v_target, v_detail,
    coalesce(p_result, 'success')
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- 書込は authenticated のみ（公開ページ anon には付与しない）。直接呼び出しは definer 経由なので安全。
revoke all on function public.log_audit(text, text, text, jsonb, text) from public;
grant execute on function public.log_audit(text, text, text, jsonb, text) to authenticated;
