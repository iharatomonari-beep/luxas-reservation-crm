# タスクID：T041
# タスク名：積み残しの整合（予約一覧キャンセル日時／会計モーダル売上見込プリフィル／容量判定インターバル反映）

## 安全レベル
CAUTION（複数の既存ファイルにまたがる小修正）

## 目的
T035/T037で対象ファイル外のため見送った3点を、正しいファイルで整合させる。

## 背景
- T035: 予約一覧の「キャンセル日時」列が未対応（`reservation-list.tsx`がT035対象外だった）。
- T037: 会計モーダルの売上見込プリフィル未対応（`checkout-modal`がT037対象外）。
- T037: ブース容量判定にインターバル未反映（`hasBoothCapacity`が変更不可ファイル内だった）。

## 対象ファイル / 変更してよいファイル
- `features/reservations/reservation-list.tsx`（キャンセル日時/種別の列追加）
- `features/reservations/checkout-modal.tsx`（売上見込を初期値に）
- `features/master-data/mock-data.ts` の `hasBoothCapacity`（インターバルを占有時間に含める）
- 参照: `features/reservations/types.ts`（既存の cancelType/canceledAt/intervalMinutes/discount 等）

## 変更してはいけないファイル
- `features/customers/` `features/import-export/`
- `lib/supabase/` `supabase/` `app/` `.env*` `package.json` `tailwind.config.ts`
- 上記「変更してよいファイル」以外

## 実行内容
1. 予約一覧(`reservation-list.tsx`): 「キャンセル日時」列を実値表示（cancelType≠none の canceledAt）。可能なら種別(通常/無断/取消)も。
2. 会計モーダル(`checkout-modal.tsx`): 予約の売上見込(コース＋オプション−割引)を売上額の初期値にプリフィル。手入力で上書き可。
3. 容量判定(`hasBoothCapacity`): 予約の占有時間に intervalMinutes を加えて重複/容量を判定（台帳の表示・ドラッグ判定と整合）。
4. 既存挙動を壊さない（未設定予約は従来通り）。

## 検証方法
- `npm run lint`（エラー0）／`npm run build`（型エラー0・成功）
- 実機: 一覧でキャンセル日時表示／会計で見込プリフィル／インターバル込みで容量が埋まる。

## 完了条件
1. 3点が整合した。2. 既存を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 売上見込の計算をT037と一致させる（端数=四捨五入・小計基準）。迷えば推奨で進め報告。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/3点の対応箇所/lint・build/_index更新/実機確認依頼
