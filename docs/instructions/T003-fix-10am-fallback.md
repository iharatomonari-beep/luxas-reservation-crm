# T003: 「予約が10時にずれる」挙動の根治

## 目的
`startTime` が空・未渡しのとき、予約作成が必ず `"10:00"` に落ちる挙動を直し、意図しない時刻ずれをなくす。

## 前提（依存）
T002（店舗設定マスタ導入）が完了していること。**未完了ならこのタスクは実行せず「T002 未完了のため保留」と報告して停止する。**

## 変更対象ファイル
- `features/reservations/reservation-ledger.tsx`（`openCreateForm` の `const startTime = prefill.startTime ?? "10:00";`）
- `features/reservations/reservation-create-page.tsx`（`createInitialForm` の `const startTime = prefill.startTime || "10:00";`）

## 実行内容
1. まず、空き枠クリック導線で `startTime` が常に正しく渡っているか読んで確認する（`/dashboard/reservations/new?...&startTime=HH:mm`）。渡っていない経路があれば報告する。
2. `"10:00"` ハードコードを次のどちらかに変更する。**実装前に方針を選び、理由を報告してから実装する**:
   - (A) 店舗設定（T002）の `reservationAcceptStartTime` を既定値にする。
   - (B) `startTime` 未指定時は固定値を入れず、開始時刻入力を必須エラー扱いにする。
3. 台帳から開いた場合（prefill あり）は、渡された `startTime` をそのまま使う（回帰させない）。
4. ヘッダの「新規予約」ボタンと空き枠クリックの両方で破綻しないこと。

## 変更してはいけないファイル
- `features/customers/`、`features/import-export/`、`features/master-data/` の既存マネージャ
- `lib/supabase/`、`app/` 配下のレイアウト・認証
- 上記「変更対象ファイル」以外

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）
- 「prefill あり＝渡された時刻を使う／prefill なし＝10:00固定にならない」ことをコード上で説明

## 完了条件
1. フォールバックの `"10:00"` ハードコードが、採用方針（A or B）に従って修正された。
2. 台帳由来（prefill あり）の挙動が回帰していない。
3. lint / build が通った。
4. `docs/sessions/YYYY-MM-DD.md` に追記し、`_index.md` の T003 を「完了」に更新した。

## 停止条件
- T002 が未完了なら停止。
- 方針 A/B の選択に迷う、または影響が読みきれない場合は停止して確認を求める（勝手に決めない）。
- lint / build が通らず自力修正できない場合は停止。

## 実行後の報告内容
- 採用した方針（A or B）と理由
- 変更箇所
- prefill あり/なしの挙動の説明
- lint / build の結果
