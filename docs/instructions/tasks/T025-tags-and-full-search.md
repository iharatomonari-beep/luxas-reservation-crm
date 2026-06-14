# タスクID：T025
# タスク名：タグマスタ（顧客/予約ルート/施術カルテ）＋顧客フル検索

## 安全レベル
CAUTION（新マスタ・検索画面）

## 目的
PMの顧客情報相当: 顧客タグ/予約ルートタグ(プロモーション)/施術カルテタグ の各マスタと、顧客フル検索を追加。

## 背景
catalog §6,11。現状 Customer.tags(文字列配列)はあるがタグマスタ・予約ルート/カルテタグ・フル検索が無い。予約受付(T020)の「予約タグ」もこれを参照。

## 対象ファイル / 変更してよいファイル
- `features/master-data/types.ts`・`mock-data.ts`（タグ型/初期/キー）
- 新規: `features/master-data/tag-manager.tsx`（汎用タグCRUD、種別=顧客/予約ルート/カルテ）
- 新規: `app/dashboard/tags/page.tsx`（or 種別ごと）
- `features/customers/`（フル検索の追加。customer-manager の検索拡張 or 新規 full-search コンポーネント）
- `components/layout/sidebar.tsx`（導線）

## 変更してはいけないファイル
- `features/reservations/`（参照のみ）、`features/import-export/`
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. タグマスタ: 名前/管理コード(任意)/表示順。種別=顧客タグ/予約ルートタグ/施術カルテタグ（1画面で種別切替 or 3画面）。CRUD。
2. 予約ルートタグの例(ホームページ/メール/Instagram/多言語看板)を初期データに。
3. 顧客フル検索: 氏名/誕生月/性別/年齢/会員番号/TEL/メール/ランク/職業/タグ/住所/DM希望/最終来店から○日/顧客種別(新規/リピート)/(母店は単店なので省略可)。検索結果→顧客詳細。
4. 予約受付(T020)が予約ルートタグを参照できるようにエクスポート。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. 3種タグをCRUDでき、フル検索で顧客を絞れる。2. 既存顧客管理を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- タグの持ち方（Customer.tags文字列との整合）や検索項目の取捨で迷えば推奨で進め報告。型/保存形式の大変更は確認。`features/customers/`の既存ロジック破壊が要るならSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加マスタ・検索/タグ整合方針/lint・build/_index更新/実機確認依頼
