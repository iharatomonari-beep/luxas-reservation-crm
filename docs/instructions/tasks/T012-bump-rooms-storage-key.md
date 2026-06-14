# タスクID：T012
# タスク名：ブースの localStorage キーを v2 に上げて新ブース（8＋2）を強制反映

## 安全レベル
CAUTION（localStorage の保存キー変更。実行前にユーザー確認）

## 目的
ブースが少ない古い localStorage（`luxas-master-rooms`）を読み続けて「施術ブースの空きがありません」になる問題を恒久解消する。ブースの storage キーを v2 に上げ、全ユーザーが手動リセットなしで新しい初期ブース（施術8＋個室2）を読み込むようにする。予約・シフトで既に使われている「キーに v2 を付ける」手法と同じ。

## 背景
- `hasBoothCapacity`（`features/master-data/mock-data.ts`）は localStorage のブース一覧から台数を数える。古いデータ（ブース1個など）だと容量1になりブロックされる。
- コード上の `initialRooms` は既に施術8＋個室2（正しい）。問題は古い localStorage が上書きしていること。
- 既存の前例: `reservationsStorageKey = "luxas-reservations-v2"`、`shiftsStorageKey = "luxas-master-shifts-v2"`。ブースだけ `"luxas-master-rooms"`（v 無し）。

## 対象ファイル
- `features/master-data/mock-data.ts`（`roomsStorageKey` の値）

## 変更してよいファイル
- `features/master-data/mock-data.ts` のみ

## 変更してはいけないファイル
- `roomsStorageKey` を import している他ファイル（`import-export-manager.tsx` 等）は **変更しない**（定数を import しているので値を変えれば自動で追従する）。
- `features/reservations/`、`features/customers/`、`features/import-export/`、`lib/supabase/`、`supabase/`、`app/`
- `.env` / `.env.local`、`package.json`、`tailwind.config.ts`
- 上記「変更してよいファイル」以外すべて

## 実行内容
1. `features/master-data/mock-data.ts` の
   `export const roomsStorageKey = "luxas-master-rooms";`
   を
   `export const roomsStorageKey = "luxas-master-rooms-v2";`
   に変更する。
2. それ以外は変更しない。`roomsStorageKey` を使っている箇所は import 経由なので触らない。

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）
- 変更が `roomsStorageKey` の値1か所だけであることを確認。

## 完了条件
1. `roomsStorageKey` が `"luxas-master-rooms-v2"` になった。
2. lint / build が通った。
3. 変更が `mock-data.ts` の1行だけに収まっている。
4. `docs/sessions/2026-06-13.md` に追記し、`_index.md` の T012 を「完了」に更新した。
5. 実機（再読み込み）でブースが施術8＋個室2になり、ブース空きエラーが出ないことをユーザーが確認したら「完了」。

## 停止条件
- 実行前確認（CAUTION）でユーザー許可が出るまで着手しない。
- `roomsStorageKey` の import 元以外を変更する必要が出たら STOP（指示外ファイル変更）。
- lint / build が通らず自力修正できない場合は停止。
- 実機確認が必要：ビルド後、ユーザーが確認するまで「完了」にしない。

## 完了後の報告内容
- 完了したタスクID（T012）
- 変更した1行（before/after）
- lint / build の結果
- `_index.md` の更新内容
- ユーザーに依頼する実機確認（再読み込み→ブース8+2／移動でブース空きエラーが出ないか）
