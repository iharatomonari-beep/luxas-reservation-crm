# タスクID：T059
# タスク名：残りの新規画面（本日のオンライン設定/シフトひな型/シフトパターン/データ不備/ユーザマスタ）

## 安全レベル
CAUTION（新規画面追加。ユーザマスタの認証踏み込みはSTOP＝表示のみ）

## 目的
PMにあってLUXASに無い画面を追加する。1画面ずつ。

## PMの仕様
- 本日のオンライン設定状況(/ScheduleOnlineblocks): 開店閉店状況/オンライン公開状況/シフト状況テーブル/オンラインブロック(日付検索＋新規, 列 ID/日付/名前/ブロックID/開始/終了)。
- シフトひな型設定(/NewpmShifttemplates): 名前検索＋列(ID/ひな型名/登録スタッフ/登録シフト/予約端末/表示順)。
- シフトパターン設定(/ShiftPatterns): スプリットパネル, 左列 ID/名前/シフト時間/表示順。
- データ不備のお知らせ(/UnifyErrorKanris): スプリットパネル, 左列 ID/お知らせ・エラー/発生日時/分類/詳細。
- ユーザマスタ(/Users): 列 ID/ユーザ名/ログインID/表示順/最終ログイン時間（表示のみ・認証は触らない）。

## 対象ファイル / 追加
- app/dashboard/online-blocks/page.tsx
- app/dashboard/shift-templates/page.tsx
- app/dashboard/shift-patterns/page.tsx
- app/dashboard/data-errors/page.tsx
- app/dashboard/users/page.tsx（表示のみ）
- 各コンポーネント＋ components/layout/top-menu.tsx の導線

## 実行内容
- 各画面をPMの列・構成でモック作成（データはlocalStorage or 既存流用）。スプリットパネルはT051流用。
- ユーザマスタは一覧表示のみ（パスワード/認証/権限変更は実装しない＝STOP）。
- 1画面ずつ実装・検証。

## 変更してはいけないファイル
- 認証/Supabase/権限。既存データ破壊。

## 検証
- 各: npm run lint / npm run build 成功。実機で各画面＋メニュー導線。

## 完了条件
1. 5画面追加。2. 認証非接触。3. lint/build OK。4. _index更新＋sessions追記。5. 実機OKで完了。

## 停止条件
- 認証/権限の実装が要るなら STOP。1画面ずつ・壊れたら停止。

## 報告
- 各画面ごとに 追加ファイル / lint・build / 実機確認依頼。
