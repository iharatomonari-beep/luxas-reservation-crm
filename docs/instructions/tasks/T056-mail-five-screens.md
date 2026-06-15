# タスクID：T056
# タスク名：メール管理を5画面に（配信履歴/配信取消/メール定型文/eDM/シンプルeDM）

## 安全レベル
CAUTION（既存メール画面の分割・拡張。実送信なしモック）

## 目的
PMのメール管理5画面に合わせる。LUXASは /dashboard/mail 1画面。

## PMの仕様
- メール配信履歴(/Customers/mailhistory): 検索(顧客名/宛先/タイトル/結果/配信日)＋列(ID/顧客ID/顧客名/宛先/タイトル/成功数/失敗数/配信予定/配信済時刻)
- メール配信一括停止(/mailhistory_delete): 検索(タイトル/配信日)＋列(ID/タイトル/本文/配信予定/取消時刻)
- メール定型文設定(/MailTemplates): 定型文CRUD
- eDM設定(/AutoMails): 名前検索/新規＋列(ID/配信名/コメント/タイトル/配信頻度/配信予定/配信フラグ)
- シンプルeDM(/SimpleAutoMails): テンプレ選択(誕生日お祝い等)＋新規

## 対象ファイル / 追加
- app/dashboard/mail/page.tsx を「配信履歴」に。追加:
  - app/dashboard/mail/cancel/page.tsx（配信取消）
  - app/dashboard/mail/templates/page.tsx（定型文）
  - app/dashboard/mail/edm/page.tsx（eDM）
  - app/dashboard/mail/edm-simple/page.tsx（シンプルeDM）
- components/layout/top-menu.tsx（メール管理グループに5項目）

## 実行内容
- 各画面をモックで作成（実送信なし）。既存のメール機能(T038)があれば流用・分割。
- 列・検索・CRUDはPM準拠。1画面ずつ。

## 変更してはいけないファイル
- 実送信・外部メール連携・認証は実装しない（STOP対象）。

## 検証
- 各: npm run lint / npm run build 成功。実機で各画面＋メニュー導線。

## 完了条件
1. 5画面化。2. 実送信なしモック。3. lint/build OK。4. _index更新＋sessions追記。5. 実機OKで完了。

## 停止条件
- 実送信/外部連携/依存追加が必要なら STOP。

## 報告
- 各画面ごとに 追加・変更ファイル / lint・build / 実機確認依頼。
