# Supabase 初期セットアップ手順

この手順は、LUXAS予約・顧客管理システム v0.1 を Supabase PostgreSQL へ接続する前の準備用です。

注意:
- まだ本物の顧客情報は入れません。
- この段階では、SQL の作成とスキーマ準備だけを行います。
- 個人情報保護法や運用条件の最終確認は、必ず専門家の確認を受けてください。

## 1. 準備するもの

- Supabase プロジェクト
- SQL 実行権限
- `supabase/schema.sql`

## 2. 実行する順番

1. Supabase プロジェクトを作成する。
2. SQL Editor を開く。
3. `supabase/schema.sql` の内容を貼り付ける。
4. まずDDL全体を確認してから実行する。
5. エラーが出た場合は、外部キー順序や権限を見直す。
6. テーブル作成後、RLS 方針を別途ポリシー化する。
7. その後に、最小のシードデータだけを入れる。
8. 最後にアプリ側の Supabase 接続を進める。

## 3. schema.sql の役割

`supabase/schema.sql` には、次を含めています。

- 必須テーブルのDDL
- 主キー
- 外部キー
- `created_at`
- `updated_at`
- 更新日時の自動更新トリガー
- 主要な index
- `audit_logs`
- `import_jobs`
- `reservations` と `reservation_resources` の分離
- `customers` と `customer_notes` の分離

## 4. 実行後に確認すること

- `stores` が作成されている。
- `users` と `user_roles` が作成されている。
- `staff`、`services`、`rooms`、`shifts` が作成されている。
- `customers`、`customer_notes`、`reservations`、`reservation_resources` が作成されている。
- `import_jobs` と `audit_logs` が作成されている。
- 主要 index が作成されている。
- `updated_at` トリガーが動く。

## 5. RLS について

この初期SQLでは、RLS を完全実装していません。

理由:
- まずテーブル構造を確定したい。
- ロール別アクセス権限は、アプリの認証方式と合わせて設計したい。
- 顧客情報、カルテ、CSV出力は本番前に権限制御が必要だからです。

次の段階で行うこと:
- `auth.uid()` と `users.auth_user_id` の接続
- `user_roles` による権限制御
- `audit_logs` の参照制限
- CSVエクスポートを owner のみに限定するポリシー

## 6. 初回データ投入の注意

- 本物の顧客情報はまだ入れない。
- まずは店舗、業務ユーザー、ロール、スタッフ、メニュー、ブース、シフトの最小データだけを入れる。
- 顧客、カルテ、予約、本番CSVは後回しにする。
- 予約可否判定は、アプリ側とDB側の両方で確認できるようにしてから使う。

## 7. 本番投入前の確認項目

- [ ] テーブルがすべて作成済み
- [ ] 主要 index が作成済み
- [ ] `updated_at` が更新される
- [ ] RLS の実装順が決まっている
- [ ] CSVインポート履歴の保存先が決まっている
- [ ] `audit_logs` の対象が決まっている
- [ ] 本物の顧客CSVを入れる条件が満たされている
- [ ] 専門家確認の要否を確認済み

## 8. 補足

- このセットアップは、まだ本番データを扱う前の段階です。
- SQL の変更は、バックアップと復元手順を確認してから行ってください。
- 顧客情報、カルテ、CSV出力は、権限制御なしで本番利用しないでください。

