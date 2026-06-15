# タスクID：T062
# タスク名：tenant/area/store の管理画面＋店舗切替UI（org階層の操作・非破壊）

## 安全レベル
CAUTION（新規管理画面＋上部バーの店舗切替。既存の予約/顧客/会計データのscopeはまだ変えない）

## 目的
T061で追加した org 階層（tenant→area→store）を、画面から管理・切替できるようにする。将来の多店舗・外販SaaSの土台。**この段階では既存データを店舗で絞り込まない**（データへのstoreId付与・scopeはT063）。

## 依存
- T061（features/org/ の型・初期データ・localStorageキー）が実装済みであること。未実装なら停止。

## 対象ファイル / 追加・変更してよい
- 新規: app/dashboard/org/page.tsx（組織管理）＋ features/org/org-admin.tsx（管理UI）
- 新規: features/org/use-current-store.ts（現在店舗のlocalStorage管理フック）
- 変更: components/layout/dashboard-shell.tsx（上部バーに店舗切替セレクタを追加）
- 変更: components/layout/top-menu.tsx（「店舗情報」グループに「組織管理」リンク追加。実在ルートのみ）
- 参照: components/master/master-split-panel.tsx（T051・流用可）

## 変更してはいけないファイル
- 予約/顧客/会計の型・データ・画面ロジック（scope変更はしない＝T063）。

## 実行内容
1. 組織管理画面 `/dashboard/org`:
   - 3区分（テナント / エリア / 店舗）をタブ or 3スプリットパネルでCRUD。
   - テナント: name / code? / plan? / isActive / sortOrder
   - エリア: 所属テナント(選択) / name / code? / isActive / sortOrder
   - 店舗: 所属テナント(選択) / 所属エリア(選択) / name / code? / isActive / sortOrder
   - 保存はT061のlocalStorageキー（luxas-tenants/areas/stores）。
2. 現在店舗コンテキスト:
   - localStorageキー（例 "luxas-current-store-id"）で現在店舗IDを保持。初期値は T061 の currentStoreId（store-shibuya）。
   - 小さなフックで現在店舗・そのarea・tenantを取得できるように。
3. 店舗切替UI（上部バー）:
   - dashboard-shell のヘッダーに「現在: テナント名 / エリア名 / 店舗名」表示＋店舗選択ドロップダウン（stores一覧から選択→localStorage更新）。
   - **選択しても既存画面のデータは変わらない**（まだscopeしない）。切替が効くのは将来のscope対応後である旨をUIに小さく注記。
4. メニュー導線: 「店舗情報」グループに「組織管理」を追加（/dashboard/org）。死にリンクにしない。

## 検証
- npm run lint / npm run build 成功。
- 実機: /dashboard/org でテナント/エリア/店舗のCRUDが動く。上部バーに店舗切替が出て、選択がリロード後も保持される。既存画面（台帳/顧客等）の表示・動作は従来どおり変わらない。

## 完了条件
1. 組織管理画面＋店舗切替UI＋現在店舗の保持。2. 既存データのscopeは未変更（非破壊）。3. lint/build OK。4. _index更新＋sessions追記。5. 実機OKで完了。

## 停止条件
- T061未実装なら停止。既存の予約/顧客/会計の型・データ変更が必要に見えたら STOP（それはT063）。

## 報告
- 完了ID T062 / 追加・変更ファイル / lint・build / 「既存データは未scope（非破壊）」である旨 / 実機確認依頼。

## 補足（次段階・このタスクではやらない）
- T063: 新規作成データに storeId を付与し、現在店舗でデータをscope（既存データは段階移行・非強制）。Supabase移行時に正式キー化＋RLS。
