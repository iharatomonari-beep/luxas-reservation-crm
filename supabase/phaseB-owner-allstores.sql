-- 案B（多店舗・B-min）③ オーナーを全店ロールに統一
-- app_user_store_ids() は scope_store_id IS NULL のロールを「自テナント全店」と解釈する。
-- オーナーの scope_store_id を null にすることで、7店舗すべての store スコープ表を閲覧/管理できる。
-- （店長/スタッフの店舗限定ロールは今回作らない＝オーナー全店で運用）。
-- 冪等（再実行安全）。

update public.user_roles
set scope_store_id = null
where role = 'owner' and scope_store_id is not null;

-- 確認用（任意）：オーナーロールの現状
-- select user_id, role, scope_store_id from public.user_roles where role = 'owner';
