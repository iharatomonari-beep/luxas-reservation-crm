# T001: 予約枠ドラッグ移動の静的確認（実装変更なし）

> 状態: 完了（2026-06-13 実行済み）。結果は `docs/sessions/2026-06-13.md` を参照。
> 再実行は不要。記録として残す。

## 目的
予約枠ドラッグ移動が仕様どおりに実装されているかを、コードを読んで静的に確認する。新機能追加も修正もしない。診断ログは温存する（実機確認後に別タスクで削除）。

## 変更対象ファイル
- なし（読み取り専用。コードは一切変更しない）

## 実行内容
1. 次の関数を読む: `processPointerMove` / `handleTimelinePointerUp` / `validateDraggedReservation` / `getVisibleStaffForSelectedDate` / 座標→時刻・スタッフ変換の箇所（すべて `features/reservations/reservation-ledger.tsx`）。
2. 下記仕様との不一致・あやしい点を箇条書きで報告する（修正はしない）。
   - 横移動＝開始時刻変更（5分スナップ・幅不変）。
   - 縦移動＝担当スタッフ変更。
   - 同一スタッフ または 同一ブースの既存予約と時間重複ならブロック。
   - 別日移動はドラッグ不可（保留棚経由）。
   - 表示は当日有効シフトのスタッフのみ。
   - 横方向座標変換の `scrollLeft` / `getBoundingClientRect` オフセット抜けの有無。
   - 縦方向の `dataset.staffId` 取得の正しさ。
3. 診断ログ `[drag:start]` / `[drag:move]` / `[drag:drop]` はそのまま残す。

## 変更してはいけないファイル
- すべて（このタスクはコード変更を一切行わない）

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）

## 完了条件
1. 仕様照合結果（不一致リスト、無ければ「一致」と明記）を報告した。
2. lint / build が通った。
3. `docs/sessions/YYYY-MM-DD.md` に結果を追記した。
4. `docs/instructions/_index.md` の T001 を「完了」に更新した。

## 停止条件
- lint / build が失敗し自力修正できない場合のみ停止。

## 実行後の報告内容
- 確認した関数一覧
- 仕様との不一致／あやしい点（無ければ「一致」）
- lint / build の結果
- コード変更が無かったことの明記
