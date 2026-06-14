# タスクID：T021
# タスク名：予約一覧画面（PM /Bookings 相当）

## 安全レベル
CAUTION（新規画面追加。実行前確認は包括承認下では省略可）

## 目的
当日（または日付指定）の予約をテーブルで一覧する画面を追加。台帳(タイムライン)とは別の俯瞰ビュー。

## 背景
PM「予約一覧＝予約ヘッダ情報」(catalog §2)。LUXASに一覧ビューが無い。

## 対象ファイル / 変更してよいファイル
- 新規: `app/dashboard/reservations/list/page.tsx`
- 新規: `features/reservations/reservation-list.tsx`
- 参照のみ: `features/reservations/mock-data.ts`・`types.ts`、master-data の staff/services

## 変更してはいけないファイル
- `reservation-ledger.tsx` / `reservation-create-page.tsx`（既存ロジック）
- `features/customers/` `features/import-export/` `features/master-data/` の既存マネージャ
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. `/dashboard/reservations/list` を追加。日付ピッカー＋検索（顧客名）。
2. 列: 予約開始時刻 / 顧客 / 性別 / リピート(回数があれば) / スタッフ / コース / 会計状況(あれば。無ければ「-」) / メモ有無 / 予約経路(あれば) / キャンセル日時。
3. localStorage の予約(`luxas-reservations-v2`)から表示。行クリックで台帳の該当日へ遷移 or 詳細表示（できる範囲）。
4. サイドバーに「予約一覧」リンクを追加（components/layout/sidebar.tsx は変更可）。

## 検証方法
- `npm run lint` / `npm run build`（型エラー0）／実機でユーザー確認。

## 完了条件
1. 一覧が表示され日付/顧客名で絞れる。2. 既存を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 会計状況など未実装項目の扱いに迷えば「-」表示で進め報告（停止不要）。型追加が必要なら停止確認。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加画面/列構成/sidebar変更/lint・build/_index更新/実機確認依頼
