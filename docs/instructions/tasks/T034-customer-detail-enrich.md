# タスクID：T034
# タスク名：顧客詳細の充実（来店/予約履歴・カルテ・注意事項・タグ・PM明細項目）

## 安全レベル
CAUTION（顧客管理画面のUI/型拡張）

## 目的
顧客詳細をPM相当に充実させる。予約履歴/来店履歴・カルテメモ・注意事項・タグ・会員情報（会員番号/ランク/総来店/総売上/初回・最終来店 等）を1画面で確認できるように。

## 背景
catalog §5,6。LUXASの顧客詳細は基本情報＋カルテメモ＋予約履歴程度。PMの明細項目・タグ・施術カルテに寄せる。

## 対象ファイル / 変更してよいファイル
- `features/customers/customer-manager.tsx`（詳細パネル拡充）
- `features/customers/types.ts`（不足項目の任意追加）
- 参照: 予約データ(履歴)、T025タグ

## 変更してはいけないファイル
- `features/reservations/`の既存ロジック / `features/import-export/`の取込ロジック（参照は可）
- `features/master-data/` / `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. 顧客詳細に: 注意事項（目立つ表示）/ カルテメモ（時系列・追記）/ 予約履歴（新しい順）/ 会員情報（会員番号/ランク/総来店回数/総売上/初回来店/最終来店）/ タグ表示（T025）。
2. 不足する顧客項目は型に任意追加（既存のPM明細import項目があれば活用）。
3. 予約履歴は予約localStorageからphone/名前一致で集約。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. 顧客詳細でPM相当の情報が見える。2. 既存の検索・作成・カルテ保存を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 型追加・履歴集約の方式は推奨で進め報告。import取込ロジックの破壊が要ればSTOP。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/拡充項目/履歴集約方式/lint・build/_index更新/実機確認依頼
