# タスクID：T029
# タスク名：決済・その他マスタ（クレカ会社/電子マネー/ユーザ）＋(任意)TORICOM設定

## 安全レベル
CAUTION（新マスタ。ユーザ/認証に踏み込む部分はSTOP寄り）

## 目的
PMの店舗情報のうち未実装マスタを追加（低優先）。

## 背景
catalog §10。クレカ会社(手数料率%)・電子マネー(Suica/iD/QUICPay/PayPay・手数料率)・ユーザマスタ。TORICOMは外部連携設定。

## 対象ファイル / 変更してよいファイル
- `features/master-data/types.ts`・`mock-data.ts`（クレカ/電子マネー型・初期）
- 新規: `features/master-data/creditcard-manager.tsx` / `emoney-manager.tsx`
- 新規: `app/dashboard/creditcards/page.tsx` / `app/dashboard/emoney/page.tsx`
- `components/layout/sidebar.tsx`（導線）

## 変更してはいけないファイル
- 認証・ユーザのログイン処理（`components/auth/`、`app/login`、`lib/supabase/`）＝**STOP**
- `features/reservations/` `features/customers/` `features/import-export/`
- `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. クレジットカード会社マスタ: 会社名/手数料率(%)/表示順。CRUD。
2. 電子マネーマスタ: 名前(Suica/iD/QUICPay/PayPay)/手数料率(%)/表示順。CRUD＋初期データ。
3. これらは会計(T022)の支払種類選択肢に使う。
4. ユーザマスタ/TORICOM設定は**認証・外部連携に関わるためこのタスクでは作らない**（STOP対象。必要時に別途）。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. クレカ/電子マネーをCRUDできる。2. 既存を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- ユーザ/認証/TORICOMに踏み込む必要が出たらSTOP。会計(T022)の支払選択肢との結合方針は推奨で進め報告。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加マスタ/会計との結合/lint・build/_index更新/実機確認依頼
