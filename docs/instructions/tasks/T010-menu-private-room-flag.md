# タスクID：T010
# タスク名：メニューに「個室必須」フラグを追加＋ブース容量判定ヘルパを用意

## 安全レベル
CAUTION（型・データ・ロジック追加。実行前にユーザー確認）

## 目的
ブース自動配置（個別ブースを固定しない）方式の土台として、
1. 施術メニューに「個室必須かどうか」のフラグを持たせる。
2. 「同時刻に施術ブース/個室が空いているか」を台数ベースで判定するヘルパ関数を用意する。
を行う。判定ロジックの差し替え（予約作成・台帳）は次タスク T011 で行う。**このタスクでは型・データ・ヘルパの追加まで。既存の予約可否判定には手を入れない。**

## 背景
- 方針: 予約にブースを固定しない。メニューが「個室必須」なら個室枠（個室の台数=2）で、そうでなければ施術ブース枠（施術ブースの台数=8）で空きを判定する。
- 容量の元データ: `initialRooms`（T008 で 施術ブース8＋個室2）。`kind: 'treatment'` 件数＝施術枠、`kind: 'private'` 件数＝個室枠。
- メニュー型: `ServiceMenu`（`features/master-data/types.ts`）。メニューデータ: `initialServices`（`features/master-data/mock-data.ts`）。

## 対象ファイル
- `features/master-data/types.ts`（`ServiceMenu` にフラグ追加）
- `features/master-data/mock-data.ts`（`initialServices` にフラグ値、容量ヘルパの置き場所として可）
- 参照のみ: `features/reservations/types.ts`（`Reservation` 構造の確認）

## 変更してよいファイル
- `features/master-data/types.ts`
- `features/master-data/mock-data.ts`

## 変更してはいけないファイル
- `features/reservations/`（このタスクでは判定ロジックを変えない）
- `features/customers/`、`features/import-export/`、`lib/supabase/`、`supabase/`、`app/`
- `.env` / `.env.local`、`package.json`、`tailwind.config.ts`
- 上記「変更してよいファイル」以外すべて

## 実行内容
1. `ServiceMenu` 型に `requiresPrivateRoom: boolean`（個室必須）を追加する。
2. `initialServices` の各メニューに `requiresPrivateRoom` を設定する:
   - 基本は `false`（施術ブースでOK）。
   - 「オイル」系など個室で行うメニューがあれば `true`。該当が判断できない場合は全て `false` にし、「どのメニューを個室必須にするか要確認」と報告する（勝手に決めない）。
3. 容量判定ヘルパを用意する（置き場所は既存の流儀に合わせる。例 `features/master-data/utils.ts` か `mock-data.ts` 近辺）:
   - 入力: 対象予約（日付・開始/終了時刻・メニュー）、当日の全予約、メニュー一覧、ブース一覧。
   - 処理: メニューの `requiresPrivateRoom` で必要種別（`private` or `treatment`）を決め、**同時刻に時間が重なる同種予約の件数**を数え、その種別のブース台数未満なら「空きあり(true)」、台数以上なら「空きなし(false)」を返す。
   - 自分自身（編集中の予約）は件数から除外できるようにする。
4. このヘルパはまだ呼び出さなくてよい（T011 で接続）。エクスポートだけしておく。

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）
- 既存の予約作成・台帳の挙動が変わっていないこと（今回は判定差し替えをしないため）。

## 完了条件
1. `ServiceMenu.requiresPrivateRoom` が追加され、`initialServices` に値が入った。
2. 容量判定ヘルパが追加・エクスポートされた。
3. lint / build が通った。
4. 変更が指定ファイルだけに収まっている。
5. `docs/sessions/2026-06-13.md` に追記し、`_index.md` の T010 を「完了」に更新した。

## 停止条件
- 実行前確認（CAUTION）でユーザー許可が出るまで着手しない。
- どのメニューを個室必須にするか判断できない場合は、全て false にしたうえで「要確認」として報告（停止はしないが明記）。
- 指定ファイル以外の変更が必要になったら STOP。
- lint / build が通らず自力修正できない場合は停止。

## 完了後の報告内容
- 完了したタスクID（T010）
- 追加したフラグと、個室必須にしたメニュー（または「全て false・要確認」）
- 容量判定ヘルパの仕様（入力・戻り値・置き場所）
- lint / build の結果
- `_index.md` の更新内容
