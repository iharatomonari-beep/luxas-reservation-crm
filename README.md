# LUXAS Reservation CRM

LUXAS予約・顧客管理システム v0.1 の1週間プロトタイプです。Day 7 時点では、ログイン、管理画面、予約台帳、顧客管理、CSV入出力までを localStorage ベースで確認できます。

## 技術スタック

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL / Supabase Auth
- Vercel

## セットアップ

依存関係をインストールします。

```bash
npm install
```

環境変数ファイルを作成します。

```bash
cp .env.example .env.local
```

Supabase を使う場合は、`.env.local` に以下を設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

未設定でも、管理画面プレビューとして動作します。Supabase 接続後は実ログインに切り替わります。

## 起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

localStorage は origin 単位で分かれます。`http://localhost:3000` と `http://localhost:3001` を混ぜて開くと、予約台帳と予約作成ページで別の localStorage を見るため、保存した予約が反映されません。予約台帳と予約作成ページは同じホスト・同じポートで開いてください。

- `/login` ログイン画面
- `/dashboard` 管理画面トップ
- `/dashboard/reservations` 予約台帳
- `/dashboard/reservations/new` 予約作成
- `/dashboard/customers` 顧客管理
- `/dashboard/import-export` CSV入出力

## サンプルデータの使い方

- 予約台帳と顧客管理は、初期サンプルデータが入った状態で開けます。
- CSV入出力のサンプルは `docs/sample-csv/` にあります。
- 予約CSVを試す場合は、先に `staff.csv` と `services.csv` を取り込むと名前解決が通りやすくなります。

## localStorage を初期化する方法

ブラウザの開発者ツールで `localStorage` を消すと、初期サンプルに戻せます。

```js
localStorage.removeItem("luxas-master-staff")
localStorage.removeItem("luxas-master-services")
localStorage.removeItem("luxas-master-rooms")
localStorage.removeItem("luxas-master-shifts")
localStorage.removeItem("luxas-reservations-sample")
localStorage.removeItem("luxas-customers-sample")
```

ページを再読み込みすると、初期データで再表示されます。

## 確認コマンド

```bash
npm run lint
npm run build
```

## 画面の操作手順

### 予約台帳

1. `/dashboard/reservations` を開きます。
2. 右上の「新規予約」から、別タブで `/dashboard/reservations/new` を開きます。
3. 空いている時間枠をクリックすると、そのスタッフ・日付・開始時刻付きで `/dashboard/reservations/new` が別タブで開きます。
4. 前日・今日へ戻る・翌日で日付を切り替えます。
5. 予約カードを選ぶと、上部に選択中の予約と編集・キャンセルのボタンが出ます。
6. 予約詳細を開いて、顧客管理への移動や顧客情報の確認を行います。
7. 同じスタッフ、同じブースで重複する時間帯を確認します。

### 予約作成ページ

1. `/dashboard/reservations/new` を開きます。
2. 予約台帳から開いた場合は、スタッフ、日付、開始時刻が入ります。
3. 顧客名と電話番号を先に入れます。
4. メニューを選ぶと、所要時間に合わせて終了時刻が補完されます。
5. 担当スタッフとブースを選び、日時を決めます。
6. シフト外、休憩時間、対応外メニュー、停止中ブースはエラーになります。
7. 顧客が登録済みなら注意事項が表示されます。
8. 予約台帳から別タブで開いた場合、保存すると予約が localStorage に追加され、元の予約台帳タブに通知してから作成タブが自動で閉じます。
9. 自動で閉じられないブラウザでは、保存メッセージと予約台帳へ戻る導線が出ます。

### シフト管理

1. `/dashboard/shifts` を開きます。
2. スタッフ、日付、勤務時間、休憩時間、メモ、有効/無効を確認します。
3. 予約可否判定では、このシフト情報を使います。

### 顧客管理

1. `/dashboard/customers` を開きます。
2. 氏名、フリガナ、電話番号、メール、タグで検索します。
3. 「新規顧客」から顧客を作成します。
4. 顧客一覧の行を選んで詳細を開きます。
5. 顧客詳細の上部で注意事項を確認します。
6. カルテメモを注意事項より上の入力欄で編集して保存します。
7. 予約履歴は新しい順で確認します。
8. 詳細から予約作成へ進む場合は「予約作成へ」を使います。

### CSV入出力

1. `/dashboard/import-export` を開きます。
2. 顧客、スタッフ、メニュー、予約のCSVを選びます。
3. プレビューで必須項目エラーと件数を確認します。
4. 「取り込む」で localStorage に追加します。
5. 「書き出す」で現在データをCSVとしてダウンロードします。

### PeakManager顧客明細CSVの取り込み

1. `/dashboard/import-export` を開きます。
2. まず `docs/sample-csv/peakmanager-customers-sample.csv` を選んで、5件のダミーデータで表示イメージを確認します。
3. 「PeakManager顧客明細CSV取り込み」で同じ構造のCSVを選びます。
4. 1行目のタイトル行は無視され、2行目のヘッダーを元にプレビューされます。
5. 会員番号、ランク、総来店回数、総売上金額（税込）、取消、無断キャンセル、初回来店店舗、最終来店店舗を確認します。
6. 「取り込む」で既存データに追加します。
7. 顧客詳細では PeakManager情報として上記項目を確認できます。
8. ダミーデータでの取り込み確認は完了済みです。

## v0.1 Day 1 の範囲

- ログイン画面
- Supabase接続準備
- ログイン後の管理画面レイアウト
- サイドメニュー
- ダッシュボードトップ

## v0.1 Day 2 の範囲

マスタ管理は Supabase 未接続でも動くよう、ブラウザのローカル状態に保存します。

- `/dashboard/staff`: スタッフ管理
- `/dashboard/services`: メニュー管理
- `/dashboard/rooms`: ブース管理
- `/dashboard/shifts`: シフト管理

## v0.1 Day 3 の範囲

- `/dashboard/reservations`: 予約台帳
- 日付切替
- スタッフ別カラム表示
- 5分単位の時間グリッド
- 予約カード表示
- 予約カードクリックによる詳細モーダル

## v0.1 Day 4 の範囲

- 予約作成
- 予約編集
- 予約キャンセル
- ステータス変更
- 同じスタッフまたは同じブースの重複予約防止

## v0.1 Day 5 の範囲

- `/dashboard/customers`: 顧客管理
- 顧客検索
- 顧客新規作成
- 顧客編集
- 顧客詳細
- 注意事項とカルテメモの保存
- 予約履歴の表示

## v0.1 Day 6 の範囲

- `/dashboard/import-export`: CSV入出力
- 顧客、スタッフ、メニュー、予約のCSVインポート
- インポート前プレビュー
- 必須項目エラー表示
- 顧客、スタッフ、メニュー、予約のCSVエクスポート

## v0.1 Day 7 の範囲

- 主要画面の表示確認
- 導線確認
- README とチェックリストの更新
- 手動確認用ドキュメントの整備

PeakManager の UI、CSS、画像、アイコン、文言はコピーしていません。
