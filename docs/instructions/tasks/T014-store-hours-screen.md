# タスクID：T014
# タスク名：店舗の営業時間を設定する画面を作り、タイムラインの全日表示と連動させる

## 安全レベル
CAUTION（新規画面・主要設定の編集。実行前にユーザー確認）

## 目的
店舗の営業時間（開始・終了）を画面から設定できるようにし、その値を予約台帳タイムラインの「全体（全日）」表示の時間範囲と一致させる。

## 背景
- 店舗設定は T002 で `StoreSettings`（`businessStartTime`/`businessEndTime`/`slotMinutes` 等）として導入済み。台帳はこれを参照する。
- 全日表示の時間範囲は T007（基本/全体切替）で営業時間に合わせる方針。本タスクはその営業時間を**編集できる画面**を追加する。
- サイドバーの「店舗設定」リンクは現在 `/dashboard/settings` でプレースホルダ（`app/dashboard/[section]/page.tsx`）。ここを実画面にする。

## 対象ファイル
- 新規: `app/dashboard/settings/page.tsx`（営業時間設定ページ）
- 新規可: `features/store-settings/` 配下に設定編集UIコンポーネント（既存マスタ画面の作りに合わせる）
- 参照/利用: T002 で作った店舗設定の型・保存ヘルパ（`features/master-data/` 配下など）

## 変更してよいファイル
- `app/dashboard/settings/page.tsx`（新規）
- `features/store-settings/`（新規ディレクトリ・コンポーネント）
- T002 で作成した店舗設定モジュール（保存・読み出しに必要な範囲のみ。型は壊さない）

## 変更してはいけないファイル
- `features/reservations/reservation-ledger.tsx`（参照の差し替えは T007 側。本タスクでは台帳ロジックを変えない）
- `features/customers/`、`features/import-export/`、`features/master-data/` の既存マネージャ
- `app/dashboard/[section]/page.tsx`（settings 専用ルートを新設するので、catch-all は触らない）
- `lib/supabase/`、`supabase/`、`.env` / `.env.local`、`package.json`、`tailwind.config.ts`
- 上記「変更してよいファイル」以外すべて

## 実行内容
1. `/dashboard/settings` に営業時間設定画面を作る:
   - 入力: 営業開始時刻 `businessStartTime`、営業終了時刻 `businessEndTime`（必要なら `slotMinutes` も）。
   - 保存すると店舗設定（T002のlocalStorage）に反映。既存マスタ画面と同じ保存UX（保存ボタン・完了メッセージ）。
   - 入力検証: 開始 < 終了、HH:mm 形式。
2. タイムラインの「全体」表示が、この `businessStartTime`〜`businessEndTime` と一致することを確認する（T007 が未完なら、本タスクでは画面作成までとし、連動は T007 で担保する旨を報告）。
3. サイドバーの「店舗設定」から `/dashboard/settings` に遷移してこの画面が出ることを確認。

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）
- 実機（`npm run dev`）でユーザー確認。

## 完了条件
1. `/dashboard/settings` で営業時間を編集・保存できる。
2. 保存値が店舗設定に反映される（再読み込みで保持）。
3. lint / build が通った。
4. `docs/sessions/2026-06-13.md` に追記し、`_index.md` の T014 を更新した。
5. ユーザーの実機確認OKで「完了」。

## 停止条件
- 実行前確認（CAUTION）でユーザー許可が出るまで着手しない。
- T002 の店舗設定モジュールの形が不明で判断できない場合は停止して確認。
- 全体表示との連動が T007 未完で担保できない場合は、画面作成までで止めて報告。
- 指定範囲外のファイル変更が必要なら STOP。
- lint / build が通らず自力修正できない場合は停止。

## 完了後の報告内容
- 完了したタスクID（T014）
- 追加した画面・コンポーネント
- 営業時間の保存先と反映の仕組み
- 全体表示との連動状況（連動済み / T007待ち）
- lint / build の結果
- ユーザーに依頼する実機確認
