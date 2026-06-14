# LUXAS予約・顧客管理システム Supabase DB設計

この文書は、LUXAS予約・顧客管理システム v0.1 を `localStorage` 版から Supabase PostgreSQL 版へ移行するためのDB設計メモです。

注意:
- これは実装前の設計整理であり、法的判断の最終確定ではありません。
- 個人情報保護法、関連ガイドライン、運用条件の最終確認は、必ず専門家の確認を受けてください。
- 本物の顧客情報はまだ使いません。Supabase接続後に初めて本番データ投入を検討します。

## 1. Supabase本接続の目的

- 顧客、予約、シフト、マスタ、操作ログを一元管理する。
- ブラウザ依存の `localStorage` から脱却し、複数端末で同じデータを扱えるようにする。
- 認証、権限分離、監査、バックアップ、復旧を本番運用に乗せる。
- 予約可否判定を画面側だけでなく、サーバー側でも実施できるようにする。

## 2. localStorage版からSupabase版へ移行する理由

1. localStorage は端末ごとに分かれるため、実店舗運用に向かない。
2. ログ、バックアップ、復旧、監査の管理が弱い。
3. 本人情報、カルテ、予約履歴、売上の保護を本番水準に上げる必要がある。
4. ロール別アクセス制御をサーバー側で強制したい。
5. 予約可否判定を DB 側でも再現し、画面だけに依存しないようにしたい。

## 3. 必要なテーブル一覧

必須テーブル:
- `stores`
- `users`
- `user_roles`
- `staff`
- `services`
- `rooms`
- `shifts`
- `customers`
- `customer_notes`
- `reservations`
- `reservation_resources`
- `import_jobs`
- `audit_logs`

補助的に追加候補:
- `reservation_status_history`
- `file_attachments`
- `system_settings`

## 4. 各テーブルの目的と主要カラム

### 4-1. `stores`

目的:
- 店舗単位の設定を持つ。
- 将来の多店舗化に備える。

主要カラム:
- `id uuid primary key`
- `name text not null`
- `code text unique`
- `timezone text not null default 'Asia/Tokyo'`
- `business_start time not null`
- `business_end time not null`
- `slot_minutes integer not null default 15`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

個人情報を含むか:
- いいえ

### 4-2. `users`

目的:
- Supabase Auth の `auth.users` と業務用ユーザー情報をつなぐ。

主要カラム:
- `id uuid primary key`
- `auth_user_id uuid unique references auth.users(id)`
- `store_id uuid references stores(id)`
- `display_name text not null`
- `email text`
- `is_active boolean not null default true`
- `last_login_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

個人情報を含むか:
- はい。メールアドレスを含む可能性がある。

### 4-3. `user_roles`

目的:
- ユーザーに対する業務ロールを管理する。

主要カラム:
- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `role text not null`
- `scope_store_id uuid references stores(id)`
- `created_at timestamptz not null default now()`

想定ロール:
- `owner`
- `manager`
- `therapist`
- `reception`

個人情報を含むか:
- いいえ

### 4-4. `staff`

目的:
- スタッフマスタを管理する。
- 予約担当、表示名、対応可能メニュー、表示順、在籍状態を持つ。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `user_id uuid references users(id)`
- `full_name text not null`
- `display_name text not null`
- `role text not null`
- `sort_order integer not null default 0`
- `service_menu_ids uuid[]` または中間テーブル
- `is_active boolean not null default true`
- `memo text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

個人情報を含むか:
- はい。氏名を含む。

### 4-5. `services`

目的:
- メニューを管理する。
- 予約作成時の選択肢、所要時間、価格、カテゴリを持つ。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `name text not null`
- `category text not null`
- `duration_minutes integer not null`
- `price integer not null default 0`
- `sort_order integer not null default 0`
- `is_active boolean not null default true`
- `memo text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

個人情報を含むか:
- いいえ

### 4-6. `rooms`

目的:
- ブース、個室、カウンセリングスペースを管理する。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `name text not null`
- `kind text not null`
- `memo text`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

個人情報を含むか:
- いいえ

### 4-7. `shifts`

目的:
- スタッフの勤務時間、休憩時間、メモを管理する。
- 予約可否判定の基礎にする。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `staff_id uuid not null references staff(id)`
- `shift_date date not null`
- `start_time time not null`
- `end_time time not null`
- `break_start time`
- `break_end time`
- `memo text`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

個人情報を含むか:
- はい。スタッフ情報に紐づく。

### 4-8. `customers`

目的:
- 顧客の基本情報を管理する。
- 顧客詳細、予約履歴、カルテ、注意事項の起点にする。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `peak_manager_customer_id text`
- `name text not null`
- `name_kana text`
- `phone text`
- `email text`
- `birth_date date`
- `gender text`
- `postal_code text`
- `prefecture text`
- `address_line1 text`
- `address_line2 text`
- `address text`
- `membership_number text`
- `occupation text`
- `dm_send text`
- `newsletter_email text`
- `rank text`
- `first_visit_at timestamptz`
- `first_visit_store text`
- `last_visit_at timestamptz`
- `last_visit_store text`
- `total_visits integer not null default 0`
- `total_sales_ex_tax bigint not null default 0`
- `total_sales_inc_tax bigint not null default 0`
- `phone_reservation_count integer not null default 0`
- `pc_online_reservation_count integer not null default 0`
- `mobile_online_reservation_count integer not null default 0`
- `cancel_count integer not null default 0`
- `no_show_count integer not null default 0`
- `caution text`
- `chart_memo text`
- `tags text[] not null default '{}'`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

個人情報を含むか:
- はい

### 4-9. `customer_notes`

目的:
- カルテメモ、注意事項、来店時メモを時系列で残す。
- 1件の顧客に対して複数件のノートを保存する。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `customer_id uuid not null references customers(id)`
- `reservation_id uuid references reservations(id)`
- `author_user_id uuid references users(id)`
- `note_type text not null`
- `body text not null`
- `is_sensitive boolean not null default false`
- `created_at timestamptz not null default now()`

個人情報を含むか:
- はい。内容次第でセンシティブ情報を含む。

### 4-10. `reservations`

目的:
- 予約台帳の中核データを持つ。
- 顧客、スタッフ、メニュー、ブース、時間、ステータスを管理する。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `customer_id uuid references customers(id)`
- `customer_name text not null`
- `customer_phone text`
- `staff_id uuid not null references staff(id)`
- `service_id uuid not null references services(id)`
- `room_id uuid not null references rooms(id)`
- `reservation_date date not null`
- `start_time time not null`
- `end_time time not null`
- `status text not null default 'booked'`
- `memo text`
- `created_by uuid references users(id)`
- `updated_by uuid references users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

個人情報を含むか:
- はい

### 4-11. `reservation_resources`

目的:
- 1件の予約に対して、使ったブースや追加資源を明示する。
- 将来の複数資源割当てに備える。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `reservation_id uuid not null references reservations(id)`
- `resource_type text not null`
- `resource_id uuid not null`
- `created_at timestamptz not null default now()`

個人情報を含むか:
- いいえ

### 4-12. `import_jobs`

目的:
- CSVインポートの実行履歴を残す。
- 成功件数、失敗件数、対象データ種別を追跡する。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `created_by uuid references users(id)`
- `dataset_key text not null`
- `source_file_name text`
- `source_file_hash text`
- `status text not null`
- `total_rows integer not null default 0`
- `success_rows integer not null default 0`
- `failure_rows integer not null default 0`
- `error_summary text`
- `started_at timestamptz`
- `finished_at timestamptz`
- `created_at timestamptz not null default now()`

個人情報を含むか:
- いいえ。ただしファイル名や摘要に注意する。

### 4-13. `audit_logs`

目的:
- 顧客詳細閲覧、顧客編集、CSVインポート、CSVエクスポートなどを監査する。
- 操作の追跡と不正利用調査に使う。

主要カラム:
- `id uuid primary key`
- `store_id uuid references stores(id)`
- `actor_user_id uuid references users(id)`
- `actor_role text not null`
- `action_type text not null`
- `target_type text not null`
- `target_id uuid`
- `detail jsonb`
- `result text not null`
- `created_at timestamptz not null default now()`

個人情報を含むか:
- 原則いいえ。ただし `detail` に個人情報本文を入れない。

## 5. ロール別アクセス権限

### 5-1. `owner`

- 全テーブルを参照・更新できる。
- CSVエクスポートが可能。
- 権限変更、バックアップ設定、運用設定を扱える。

### 5-2. `manager`

- 顧客、予約、スタッフ、メニュー、ブース、シフトを管理できる。
- CSVインポートは可能。
- CSVエクスポートは原則不可。
- 一部の監査ログは参照できる。

### 5-3. `therapist`

- 顧客、予約、シフトを参照できる。
- カルテ、注意事項、予約履歴を参照できる。
- 顧客編集は必要最小限に限定する。
- CSV出力は不可。

### 5-4. `reception`

- 予約作成、編集、参照を中心に使う。
- 顧客の基本情報参照は可。
- カルテ、売上、CSVエクスポートは不可。
- 停止中ブースの新規予約選択は不可。

### 5-5. RLSの基本方針

- `store_id` で店舗を必ず絞る。
- `auth.uid()` と `users.auth_user_id` を必ず接続する。
- `owner` と `manager` は編集範囲が広い。
- `therapist` と `reception` は参照範囲を狭くする。
- `audit_logs` は原則 owner / manager のみ参照可にする。

## 6. 操作ログ対象

必ず `audit_logs` の対象にするもの:
- 顧客詳細閲覧
- 顧客編集
- CSVインポート
- CSVエクスポート

追加で記録候補:
- 予約作成
- 予約編集
- 予約キャンセル
- シフト編集
- 権限変更
- 退職者アカウント停止

記録に残す情報:
- 実行日時
- 実行者
- ロール
- 操作種別
- 対象種別
- 対象ID
- 成功/失敗
- 件数
- 必要最小限の補足情報

残さない情報:
- 個人情報本文
- CSVの全文
- トークン
- パスワード

## 7. CSVインポート履歴の扱い

- CSVの取り込みは `import_jobs` に必ず記録する。
- 1件ごとの成否は必要なら別テーブルで保持するが、v0.1 ではまず集計でよい。
- `source_file_hash` で同一ファイルの再投入を検知できるようにする。
- `dataset_key` で `customers` / `staff` / `services` / `reservations` / `peakmanager_customers` を識別する。
- `audit_logs` には、誰が何件取り込んだかを残す。

## 8. バックアップ方針

- Supabase のバックアップ機能を前提にする。
- 重要テーブルは復元対象としてまとめる。
- `customers`、`reservations`、`customer_notes`、`audit_logs`、`import_jobs` は特に復元確認を重視する。
- 定期バックアップに加え、重要操作前のスナップショット運用を検討する。
- 復元テストを本番前に必ず実施する。
- バックアップ保管先は本番DBと分離する。

## 9. localStorageからSupabaseへ移行する順番

1. `stores`
2. `users`
3. `user_roles`
4. `staff`
5. `services`
6. `rooms`
7. `shifts`
8. `customers`
9. `customer_notes`
10. `reservations`
11. `reservation_resources`
12. `import_jobs`
13. `audit_logs`

理由:
- 先に認証・ロール・店舗を固める。
- 次にマスタを移す。
- その後、顧客と予約を移す。
- 最後に履歴と監査を乗せる。

## 10. 予約可否判定のサーバー側実施

予約作成・編集時に、サーバー側でも次を確認する前提にする:
- スタッフのシフト内か
- 休憩時間と重ならないか
- 対応可能メニューか
- ブースが利用可能か
- 同一スタッフ・同一ブースの重複がないか

画面側だけで止めず、DB更新前に必ず再検証する。

## 11. 本物の顧客CSVを入れる前の条件

1. `supabase` 本接続が完了している。
2. `stores`、`users`、`user_roles`、`staff`、`services`、`rooms`、`shifts` の基本データが入っている。
3. `customers` の保存先と RLS が確定している。
4. `audit_logs` と `import_jobs` の記録先が動いている。
5. CSVインポート前プレビューで列対応を確認できる。
6. 取り込み前にダミーCSVで同じ構造の確認が済んでいる。
7. 顧客詳細閲覧、顧客編集、CSVインポート、CSVエクスポートのログ方針が有効になっている。
8. 退職者アカウント停止の運用が決まっている。
9. バックアップと復元の手順が確認済みである。
10. 法的判断は専門家確認が済んでいるか、少なくとも確認予定がある。

## 12. 移行時の補足

- `localStorage` 版のデータ構造と Supabase 版のカラムは完全一致を前提にしない。
- 旧データは移行スクリプトで吸収する。
- CSV取り込みは、まず `import_jobs` と `audit_logs` を通す。
- 本番データを扱う前に、権限とログの抜けを塞ぐ。

