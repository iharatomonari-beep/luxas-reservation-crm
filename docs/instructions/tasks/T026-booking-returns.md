# タスクID：T026
# タスク名：返客一覧（PM /BookingReturns 相当）

## 安全レベル
CAUTION（新規画面）

## 目的
再来店促進対象（返客）やキャンセル待ちを一覧する画面を追加。

## 背景
catalog §「返客一覧」。列: 開始時間/顧客/種別/返客理由・キャンセル待ちステータス/コメント/予約タグ。

## 対象ファイル / 変更してよいファイル
- 新規: `app/dashboard/reservations/returns/page.tsx`
- 新規: `features/reservations/booking-returns.tsx`
- 参照: `features/reservations/mock-data.ts`・`types.ts`
- `components/layout/sidebar.tsx`（導線）

## 変更してはいけないファイル
- `reservation-ledger.tsx` / `reservation-create-page.tsx` の既存ロジック
- `features/customers/` `features/import-export/` `features/master-data/`
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. 返客一覧画面。日付範囲検索。列: 日付/開始時間/顧客/種別/返客理由・キャンセル待ち/コメント/予約タグ。
2. データ源: 予約の status=canceled や 返客フラグ（無ければ canceled を対象に＋「返客区分は要マスタ化」と注記）。
3. 現状データが少なければ空表示でOK。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. 返客一覧が表示・日付で絞れる。2. 既存を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 返客区分の定義（canceled流用 vs 専用フラグ）で迷えば推奨(canceled流用)で進め報告。型追加が要れば確認。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加画面/返客判定方針/lint・build/_index更新/実機確認依頼
