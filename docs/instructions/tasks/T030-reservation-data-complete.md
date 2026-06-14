# タスクID：T030
# タスク名：予約データの完全化（割引/こだわり/予約タグ/コメント/連続/オプションを保存）

## 安全レベル
CAUTION（Reservation型拡張・保存形式変更）

## 目的
T020で枠だけ作った予約受付モーダルの項目（こだわり/予約タグ/施術コメント/個別割引/一括割引/連続/オプション）を、実際に予約データへ保存し、詳細・一覧・カードに反映する。

## 背景
現状これらはUI枠のみで保存されない。PM準拠の予約として成立させる。予約タグはT025、オプションはT024のマスタを参照。

## 対象ファイル / 変更してよいファイル
- `features/reservations/types.ts`（Reservation拡張）
- `features/reservations/reservation-ledger.tsx`（受付/詳細/編集モーダルで保存・表示）
- 参照: T024オプション・T025予約ルートタグのマスタ

## 変更してはいけないファイル
- `features/customers/` `features/import-export/` `features/master-data/`の既存ロジック
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. `Reservation` に追加（推奨・任意フィールド）: `preference?: "none"|"male"`（こだわり）、`bookingTags?: string[]`（予約ルートタグID）、`comment?: string`（施術コメント。既存memoと統合 or 別）、`optionIds?: string[]`（オプション）、`discountPercent?: number`/`discountYen?: number`（個別）、`bulkDiscountPercent?/bulkDiscountYen?`（一括）、`isConsecutive?: boolean`（連続）。
2. 受付/編集モーダルの各入力を保存。詳細・一覧(T021)・カードに必要分を表示。
3. 既存予約(未設定)でも壊れないよう全て任意＋デフォルト。
4. 保存形式変更のため、必要なら reservationsStorageキーのバージョン/再シード方針を確認（local-storage.ts変更は確認）。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. モーダルの全項目が保存・再表示される。2. 既存を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- comment と既存memoの統合方針、storageキー再シードの要否は推奨で進め報告（大きい場合のみ確認）。型の破壊的変更が要ればSTOP。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加フィールド/保存・表示箇所/storage方針/lint・build/_index更新/実機確認依頼
