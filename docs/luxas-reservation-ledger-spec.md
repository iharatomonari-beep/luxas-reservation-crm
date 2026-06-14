# LUXAS Reservation Ledger Spec

この文書は、横向き予約台帳を LUXAS の受付業務に合わせて定義し直すための仕様です。PeakManager の見た目は再現せず、業務構造だけを採用します。

## 1. 画面の目的

- 当日の空きと重複をすばやく確認する
- 予約作成へすぐ進む
- 保存した予約をすぐ元の台帳に反映する
- 顧客情報、シフト、ブース、メニューの整合を確認する

## 2. 表示日の決定

優先順位:

1. URL の `date`
2. localStorage の保存日
3. 当日

ルール:

- `date` は `YYYY-MM-DD` 形式に正規化する
- URL に不正値が来たら無視する
- 保存後は受け取った日付に表示日を合わせる

## 3. 表示対象スタッフ

表示対象は、表示中の日付に有効なシフトがあるスタッフのみとする。

条件:

- `shift.workDate === selectedDate`
- `shift.isActive !== false`
- `startTime` と `endTime` が存在する
- 休憩時間が入っていても、勤務時間自体は有効であれば表示対象に含める

補足:

- シフトのないスタッフは表示しない
- 既存予約が残っているのにシフトがない場合は、データ不整合として扱う
- まずは台帳の表示をシフト優先にする

## 4. 営業時間と予約受付時間

- 店舗設定の `businessStartTime` と `businessEndTime` をタイムラインの基準にする
- `reservationAcceptStartTime` と `reservationAcceptEndTime` は空き枠クリックや作成可能時刻の制御に使う
- 予約単位は `slotMinutes` で持つ
- v0.1 の基本は 5 分単位

## 5. タイムライン構造

- 横軸は時間
- 縦軸はスタッフ
- 1 本のスタッフ行に当日の予約と空き枠を重ねる
- スタッフ列は固定幅
- 予約カードは時間方向に横長で置く

## 6. 予約カードの配置計算

予約カードの配置は次の条件で決める。

- `startTime` と `endTime` を `HH:mm` から分に変換する
- `timelineStart` と `timelineEnd` を店舗設定から取る
- `left` はタイムライン開始からの経過分で求める
- `width` は実際に見えている区間の長さで求める
- 無効時刻、逆転時刻、営業時間外だけの予約は描画しない
- 営業時間をまたぐ予約は見えている範囲だけ描画する

推奨式:

- `visibleStart = max(reservationStart, timelineStart)`
- `visibleEnd = min(reservationEnd, timelineEnd)`
- `left = (visibleStart - timelineStart) / slotMinutes * slotWidth + padding`
- `width = max(minWidth, (visibleEnd - visibleStart) / slotMinutes * slotWidth - padding)`

## 7. 空き枠クリックの導線

- 空き枠クリックで新しいタブの予約作成画面を開く
- URL には `staffId`、`date`、`startTime` を必ず含める
- `startTime` は 5 分単位に丸める
- `date` は `YYYY-MM-DD`
- タイムライン由来の値は予約作成画面で固定する

例:

`/dashboard/reservations/new?staffId=staff-001&date=2026-05-11&startTime=10:05`

## 8. 予約作成画面の固定仕様

タイムラインから来た場合は次を原則変更不可にする。

- 日付
- 担当スタッフ
- 開始時刻

表示方法:

- disabled でも readonly でもよい
- 保存時には内部 state に値が残ることを優先する
- 画面上で「予約台帳で選択済み」と分かる補足を付ける

## 9. メニュー選択後の表示

- メニューを選ぶと所要時間から終了時刻を自動補完する
- スタッフに対応していないメニューは選べない、または保存時に止める
- メニューに対応するブースだけ表示する
- スタッフに対応するメニューだけ表示する

## 10. 保存と反映

保存時のルール:

- `luxas-reservations-sample` に保存する
- `date` は `YYYY-MM-DD`
- `startTime` と `endTime` は `HH:mm`
- `staffId` は URL で渡された値と一致させる
- 保存後に `luxas-reservations-ledger-update` を localStorage に書く
- `window.opener.postMessage` で `reservation-created` を送る

通知内容:

- `type: "reservation-created"`
- `reservationId`
- `date`

台帳側の動き:

- `message` を受ける
- `storage` を受ける
- `focus` と `pageshow` で再読み込みする
- 受け取った日付に表示日を合わせる

## 11. タブの動き

- 保存成功後は短い遅延の後に `window.close()` を試す
- `window.close()` が効かない場合は保存完了表示を残す
- 保存完了表示には「予約台帳へ戻る」リンクを付ける
- 戻るリンクには保存日を必ず付ける

## 12. 予約可否判定

保存前に確認する項目:

- 顧客名
- 電話番号
- 日付
- 開始時刻
- 終了時刻
- 担当スタッフ
- ブース
- メニュー
- 5 分単位かどうか
- シフト範囲内かどうか
- 休憩時間と重ならないか
- 同じスタッフの予約と重ならないか
- 同じブースの予約と重ならないか
- 停止中ブースではないか
- スタッフがメニュー対応可能か

## 13. 今後のドラッグ移動仕様

まだ実装しない前提で、仕様だけ先に固定する。

- 同じスタッフ行の中だけで移動する
- 5 分単位でスナップする
- シフト外へは移動できない
- 休憩時間へは移動できない
- 同じスタッフまたは同じブースと重なる位置へは置けない
- 詳細表示やキャンセル操作を壊さない

## 14. デバッグしやすい構造

開発時は次の情報が画面から追えるとよい。

予約作成画面:

- 受け取った `staffId`
- 受け取った `date`
- 受け取った `startTime`
- 保存 payload の `date`
- 保存 payload の `staffId`
- 保存 payload の `startTime`
- 保存 payload の `endTime`

予約台帳:

- `selectedDate`
- loaded reservations count
- filtered reservations count
- visible shifted staff count

## 15. 画面外の設計前提

- localStorage 版では単一ブラウザ・単一店舗を前提にする
- Supabase 版では同じドメインモデルをそのまま移す
- 本物の個人情報は使わない
- PeakManager の画面デザインはコピーしない

## 16. 実装順

P0

- URL date の優先
- 空き枠からの作成導線
- 予約作成で staffId/date/startTime を固定
- 保存後の元タブ反映
- シフト中スタッフだけの表示
- 5 分単位の予約台帳

P1

- メニュー別利用可能ブース
- スタッフ別対応メニュー
- 店舗設定による営業時間と受付時間
- デバッグ表示の一時運用

P2

- ドラッグ移動
- スタッフまたぎ移動
- リサイズ
- 日次集計や経営指標への展開

