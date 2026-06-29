-- 案B（多店舗・B-min）② services をテナント共通カタログRLSに変更
-- 理由：1メニューが複数店舗で提供され得る（storeIds 配列）ため、単一 store_id の店舗スコープRLSと相性が悪い。
--       メニューは「テナント共通カタログ」とし、店舗別の出し分けは画面（profile.storeIds）で行う。
-- select：自テナントなら全メニュー閲覧可（全店で共有メニューが見える）。
-- write ：owner/manager（テナント単位）。
-- データ変更なし（RLSポリシーの差し替えのみ）。services.tenant_id は NOT NULL 済み。

drop policy if exists services_select on public.services;
create policy services_select on public.services for select to authenticated
  using ( tenant_id = public.app_user_tenant_id() );

drop policy if exists services_write on public.services;
create policy services_write on public.services for all to authenticated
  using ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) )
  with check ( tenant_id = public.app_user_tenant_id() and public.app_has_role(array['owner','manager']) );
