# タスクID：T022
# タスク名：会計（支払・レジ）＝予約に会計処理と支払方法を追加

## 安全レベル
CAUTION（新データ構造＝会計。型追加を含むため要確認ポイントあり）

## 目的
予約に「会計」操作を追加し、支払方法と会計状況を記録する。PMの「支払・レジ」(catalog §2)相当。

## 背景
LUXASは会計データが無く、集計(売上/支払内訳)が出せない。会計の最小実装でT019集計やT028経営指標の土台にする。

## 対象ファイル / 変更してよいファイル
- `features/reservations/types.ts`（会計フィールド追加）
- `features/reservations/reservation-ledger.tsx`（予約詳細に「会計」操作・会計状況表示）
- 新規可: `features/reservations/checkout-modal.tsx`（会計モーダル）

## 変更してはいけないファイル
- `reservation-create-page.tsx` / `features/customers/` `features/import-export/` `features/master-data/`
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. `Reservation` に会計情報を追加（推奨・最小）: `paymentStatus: "unpaid"|"paid"`、`payments?: { method: "cash"|"credit"|"emoney"|"ticket"|"prepaid"|"point"|"giftcard"|"epark"; cardBrand?: string; emoneyBrand?: string; amount: number }[]`、`saleAmount?: number`。
2. 予約詳細に「会計」ボタン→会計モーダル: 売上額、支払方法（複数可）、種類(クレカ/電子マネー)を入力→「会計済」に。
3. 台帳カード/予約一覧(T021)に会計状況を反映。
4. 金額の整合（合計＝売上）チェックは簡易でよい。
5. 型追加・保存形式変更は影響大→**実行前に「会計データ構造」を要確認として一旦報告**（推奨案=上記）。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. 予約を会計済にでき、支払方法が保持される。2. 一覧/カードに反映。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 会計データ構造（型）について実行前に確認（推奨案で可否を問う）。それ以外の判断は推奨で進めて報告。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加した型と会計UI/反映箇所/lint・build/_index更新/実機確認依頼
