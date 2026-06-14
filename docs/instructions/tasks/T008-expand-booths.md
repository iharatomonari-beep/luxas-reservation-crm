# タスクID：T008
# タスク名：ブースマスタを施術ブース8＋個室2にする（容量の定義として使う）

## 安全レベル
CAUTION（モックデータの変更。実行前にユーザー確認）

## 目的
新しいブース方式（予約に個別ブースを固定せず、種別ごとの台数で空きを判定する）の土台として、ブースマスタを **施術ブース8＋個室2＝計10** にする。ここで作るブース数が「同時刻に受けられる上限（容量）」になる。
※当初あった「予約の roomId を重複しないよう再割当てする」処理は **不要**（個別ブース固定をやめる方針に変更したため）。やらない。

## 背景
- ブース型: `ServiceRoom { id, name, kind: 'treatment'|'private'|'counseling'|'other', memo, isActive }`（`features/master-data/types.ts`）。
- 初期ブース: `initialRooms`（`features/master-data/mock-data.ts`、キー `luxas-master-rooms`）。
- 容量の考え方: 施術ブース `treatment` の件数 = 同時刻に受けられる施術ブース枠数。個室 `private` の件数 = 同時刻に受けられる個室枠数。
- 重要: 初期データを変えても既存 `localStorage` が残ると反映されない。完了報告にリセット手順を明記。

## 対象ファイル
- `features/master-data/mock-data.ts`

## 変更してよいファイル
- `features/master-data/mock-data.ts` のみ

## 変更してはいけないファイル
- `features/reservations/`（予約データ・ロジックはこのタスクでは触らない）
- `features/master-data/types.ts`（型は変えない）
- `features/customers/`、`features/import-export/`、`lib/supabase/`、`supabase/`、`app/`
- `.env` / `.env.local`、`package.json`、`tailwind.config.ts`
- 上記「変更してよいファイル」以外すべて

## 実行内容
1. `initialRooms` を計10件にする:
   - 施術ブース 8件: `kind: 'treatment'`、名前「ブース1」〜「ブース8」、`isActive: true`。
   - 個室 2件: `kind: 'private'`、名前「個室1」「個室2」、`isActive: true`。
   - `id` は一意。既存 id は可能なら維持して不足分を追加。
2. 予約データ（`features/reservations/mock-data.ts`）は **このタスクでは変更しない**。

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）
- `initialRooms` が施術8＋個室2＝計10になっていることをコード上で確認。

## 完了条件
1. ブースが計10（施術8＋個室2）になった。
2. lint / build が通った。
3. 変更が `mock-data.ts` だけに収まっている。
4. `docs/sessions/2026-06-13.md` に変更点と localStorage リセット手順を追記し、`docs/instructions/_index.md` の T008 を「完了」に更新した。

## 停止条件
- 実行前確認（CAUTION）でユーザー許可が出るまで着手しない。
- `mock-data.ts` 以外の変更が必要になったら STOP（指示外ファイル変更）。
- lint / build が通らず自力修正できない場合は停止。

## 完了後の報告内容
- 完了したタスクID（T008）
- 追加したブース一覧（施術8＋個室2）
- lint / build の結果
- `_index.md` の更新内容
- **localStorage リセット手順**（例: DevTools で `localStorage.removeItem("luxas-master-rooms")` を実行して再読み込み）
