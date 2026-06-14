# タスクID：T006
# タスク名：初期シフトデータの休憩時間を空にする（休憩で予約移動がブロックされる問題の緩和）

## 安全レベル
CAUTION（モックデータの変更。実行前にユーザー確認）

## 目的
予約のドラッグ移動・作成時に「選択スタッフの休憩時間と重なっています」で止まる問題を緩和する。初期シフトデータの休憩時間（`breakStart`/`breakEnd`）を空にし、デフォルトで休憩が設定されない状態にする。**休憩チェックのロジックは残す**（将来休憩を使えるように）。

## 背景
- シフトに休憩（例 14:00-15:00）が入っていると、その時間帯への予約移動が検証でブロックされる。
- ユーザー方針: 「休憩を基本的に設定しない」。よって初期データから休憩を外す。
- 重要: 既に作られた `localStorage`（キー `luxas-master-shifts-v2`）には休憩が残っているため、**初期データを空にしても既存ブラウザの表示はすぐには変わらない**。反映には localStorage のリセットが必要（完了後の報告に手順を明記する）。

## 対象ファイル
- `features/master-data/mock-data.ts`（読む・変更する）

## 変更してよいファイル
- `features/master-data/mock-data.ts` のみ

## 変更してはいけないファイル
- `features/master-data/shift-manager.tsx`（休憩入力UI・検証ロジック）
- `features/master-data/types.ts`（型定義。`breakStart`/`breakEnd` フィールド自体は残す）
- `features/reservations/`（休憩チェックのロジックは変更しない）
- `features/customers/`、`features/import-export/`、`lib/supabase/`、`supabase/`、`app/`
- `.env` / `.env.local`、`package.json`、`tailwind.config.ts`
- 上記「変更してよいファイル」以外すべて

## 実行内容
1. `features/master-data/mock-data.ts` の `initialShifts` 配列の各要素について、`breakStart` と `breakEnd` を空文字 `""` にする。
2. 型 `StaffShift` の `breakStart`/`breakEnd` フィールド自体は削除しない（空のまま保持）。
3. それ以外（勤務時間 `startTime`/`endTime`、`isActive` など）は変更しない。

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）
- `initialShifts` の全要素で `breakStart`/`breakEnd` が `""` になっていることをコード上で確認。

## 完了条件
1. `initialShifts` の休憩が全て空になった。
2. lint / build が通った。
3. 変更が `mock-data.ts` だけに収まっている。
4. `docs/sessions/2026-06-13.md` に変更点と「localStorage リセット手順」を追記し、`docs/instructions/_index.md` の T006 を「完了」に更新した。

## 停止条件
- 実行前確認（CAUTION）でユーザー許可が出るまで着手しない。
- `mock-data.ts` 以外の変更が必要になったら STOP（指示外ファイル変更）。
- 検証ロジックや型を変える必要が出たら停止して確認（今回はデータのみ）。
- lint / build が通らず自力修正できない場合は停止。

## 完了後の報告内容
- 完了したタスクID（T006）
- 変更したファイル・変更点
- lint / build の結果
- `_index.md` の更新内容
- **既存 localStorage への反映手順**（例: ブラウザの DevTools で `localStorage.removeItem("luxas-master-shifts-v2")` を実行して再読み込み、またはシフト管理画面で各シフトの休憩を空にして保存）
