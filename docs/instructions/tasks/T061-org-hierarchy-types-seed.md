# タスクID：T061
# タスク名：tenant→area→store 階層の型・初期データを最小・非破壊で追加（外販SaaS土台）

## 安全レベル
CAUTION（新規モジュール追加のみ。既存型・既存データ・既存画面は不変）

## 目的
将来の多店舗展開・外販に向け、tenant（契約法人）→ area（エリア）→ store（店舗）の階層を型と初期データだけ先行追加する。
既存の予約・顧客・会計・StoreSettingsには一切影響を与えない。

## 対象ファイル
- features/org/types.ts
- features/org/mock-data.ts
- features/org/index.ts

## 禁止
- 既存型に tenant_id / area_id / store_id を強制追加しない
- 既存localStorageキーを変更しない
- 既存画面を変更しない

## 実装
Tenant / Area / Store 型を追加。
luxas-tenants / luxas-areas / luxas-stores のキーを追加。
初期データは 株式会社東邦 → 東京 → LUXAS渋谷 の1件構成。
currentStoreId = "store-shibuya" を追加。

## 検証
npm run lint
npm run build

## 完了条件
既存画面不変、lint/build OK、_index更新、sessions追記。
