# タスクID：T032
# タスク名：物販マスタ＋物販販売登録・明細

## 安全レベル
CAUTION（新マスタ・新データ）

## 目的
PMの「物販カテゴリ/物販商品/物販販売」相当を追加。物販商品マスタと、店頭物販の販売登録・明細一覧。

## 背景
catalog §「物販販売」。LUXASに物販が無い。

## 対象ファイル / 変更してよいファイル
- `features/master-data/types.ts`・`mock-data.ts`（物販カテゴリ/物販商品 型・初期・キー）
- 新規: `features/master-data/retail-item-manager.tsx`（物販商品CRUD）
- 新規: `features/sales/retail-sales.tsx`（物販販売登録・明細一覧）
- 新規: `app/dashboard/retail/page.tsx` 等、`components/layout/sidebar.tsx`（導線）

## 変更してはいけないファイル
- `features/reservations/`の既存ロジック / `features/customers/` / `features/import-export/`
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. 物販商品マスタ: 名前/カテゴリ/単価/表示順/有効。物販カテゴリ: 名前/表示順。CRUD。
2. 物販販売登録: 日付/顧客(任意)/物販商品/数量/単価→売上小計。明細一覧(日付/顧客/物販/数量/単価/小計)。
3. 会計(T022)との連携は将来。まずは物販単体で記録。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. 物販商品をCRUDでき、販売を登録・一覧できる。2. 既存を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 会計との結合は今回スコープ外（将来）。データ保持方式は推奨で進め報告。再シード追加は確認。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加マスタ・画面/lint・build/_index更新/実機確認依頼
