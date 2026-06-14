# タスクID：T024
# タスク名：商品マスタ拡充（メニューカテゴリ管理＋オプション商品マスタ）

## 安全レベル
CAUTION（新マスタ・型追加）

## 目的
PMの商品情報相当: メニューカテゴリマスタとオプション商品マスタを追加。予約受付(T020)のカテゴリ色分け／オプション選択の元データにする。

## 背景
catalog §「通常商品/オプション/商品カテゴリ」。現状 service に category(テキスト)はあるがカテゴリ管理画面・オプションマスタが無い。

## 対象ファイル / 変更してよいファイル
- `features/master-data/types.ts`（カテゴリ型/オプション型 追加）
- `features/master-data/mock-data.ts`（初期データ＋storageキー）
- 新規: `features/master-data/category-manager.tsx` / `option-manager.tsx`
- 新規: `app/dashboard/categories/page.tsx` / `app/dashboard/options/page.tsx`
- `components/layout/sidebar.tsx`（導線追加）

## 変更してはいけないファイル
- `features/reservations/`、`features/customers/`、`features/import-export/`
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. メニューカテゴリマスタ: 名前/表示順/色(任意)。CRUD画面。メニュー(service)の category をこのマスタに紐付け（既存の文字列categoryと両立する移行は最小で）。
2. オプション商品マスタ: 名前/カテゴリ/料金(税込)/表示順/オンライン予約フラグ/種別(延長[時間+料金]・割引[%]・その他)。CRUD画面。
3. 自動再シードが要るキーは local-storage.ts の方式に合わせる（rooms同様）。※local-storage.ts変更は最小・確認推奨。
4. 予約受付(T020)から参照できるようエクスポート。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. カテゴリ/オプションをCRUDできる。2. 既存メニュー表示を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 既存 service.category(文字列) とカテゴリマスタの紐付け方針で迷えば推奨で進め報告。型/保存形式の大変更や local-storage.ts への再シード追加は確認。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加マスタと画面/カテゴリ紐付け方針/lint・build/_index更新/実機確認依頼
