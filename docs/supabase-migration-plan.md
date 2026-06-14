# LUXAS予約・顧客管理システム Supabase移行計画

この文書は、LUXAS予約・顧客管理システム v0.1 を `localStorage` 版から Supabase 接続版へ移行するための実装計画です。

注意:
- まだコード変更はしません。
- 本物の顧客情報はまだ入れません。
- 個人情報保護法や関連ガイドラインの最終判断は、必ず専門家の確認を受けてください。

## 1. localStorage版からSupabase版へ移行する全体方針

1. まずマスタデータからDB接続を始める。
2. 次に予約台帳をSupabaseへ寄せる。
3. その後に監査ログとCSV履歴をつなぐ。
4. 最後に顧客管理をDB化する。
5. `localStorage` は移行完了まで残し、段階的に置き換える。

理由:
- いきなり顧客データをDB化すると、権限、監査、RLS、CSV出力の設計が未確定のまま本番データを触ることになる。
- 先に staff / services / rooms をつなぐと、予約台帳の基礎が安定する。
- 予約可否判定を DB 側でも確認しながら、段階的に安全性を上げられる。

## 2. 最初にDB接続する機能の順番

1. `staff`
2. `services`
3. `rooms`
4. `shifts`
5. `reservations`
6. `reservation_resources`
7. `import_jobs`
8. `audit_logs`
9. `customers`
10. `customer_notes`

## 3. なぜ顧客管理を最後にするのか

- 顧客情報は個人情報であり、最も慎重な扱いが必要だから。
- 顧客詳細には注意事項、カルテ、予約履歴、売上、来店回数がまとまるため、権限制御の影響範囲が広いから。
- CSVエクスポートの対象にもなりやすく、監査ログと権限設計が先に固まっている必要があるから。
- 予約やマスタが安定してから顧客をつなぐほうが、移行失敗時の切り戻しが簡単だから。

## 4. staff / services / rooms / shifts の移行手順

### 4-1. staff

目的:
- 予約台帳とシフト管理で使うスタッフ情報を Supabase に置く。

手順:
1. `staff` テーブルに接続する。
2. 一覧、作成、編集、削除を Supabase で動かす。
3. `sort_order`、`service_menu_ids`、`is_active` を保持する。
4. 予約台帳の担当スタッフ選択を Supabase 参照に切り替える。
5. `audit_logs` に顧客詳細閲覧・編集とは別のスタッフ更新ログを残すか判断する。

### 4-2. services

目的:
- 予約作成のメニュー選択、所要時間、価格計算の基礎を置く。

手順:
1. `services` テーブルに接続する。
2. カテゴリ、所要時間、価格、表示順、有効/無効を扱う。
3. 予約フォームのメニュー選択を Supabase 参照に切り替える。
4. 自動終了時刻補完の計算に `duration_minutes` を使う。

### 4-3. rooms

目的:
- 予約で使うブース選択を Supabase に置く。

手順:
1. `rooms` テーブルに接続する。
2. 種別、メモ、有効/無効を扱う。
3. 新規予約では停止中ブースを選べないようにする。
4. 編集時は既存予約の値だけ表示維持する。

### 4-4. shifts

目的:
- 予約可否判定の基礎になる勤務時間・休憩時間を保存する。

手順:
1. `shifts` テーブルに接続する。
2. シフトの作成・編集・削除を Supabase に切り替える。
3. 予約フォームで、選択スタッフのシフト外・休憩中の予約を弾く。
4. 同一日に複数シフトがある場合の解釈を決める。

## 5. reservations / reservation_resources の移行手順

### 5-1. reservations

目的:
- 予約台帳の中核を Supabase に移す。

手順:
1. `reservations` テーブルを使う。
2. 一覧、作成、編集、キャンセルを DB 化する。
3. `customer_name` と `customer_phone` は当面保持し、`customer_id` は顧客DB化後に本格活用する。
4. 予約可否判定は、画面側だけでなくサーバー側でも実施する前提にする。
5. 同一スタッフ・同一ブースの重複予約チェックを DB 側で再検証する。

### 5-2. reservation_resources

目的:
- 予約に紐づくブースや将来の資源割当てを分離する。

手順:
1. 予約保存時に必要な資源を `reservation_resources` に入れる。
2. 現行の単一ブース運用では、まずはブース1件の割当てだけで使う。
3. 将来の追加資源にも対応できるよう、構造だけ先に使えるようにする。

## 6. customers / customer_notes の移行手順

### 6-1. customers

目的:
- 顧客管理を Supabase に移す。

手順:
1. 最後に `customers` を DB 接続する。
2. PeakManager由来の項目も含めて保存する。
3. 顧客一覧、検索、詳細、編集を Supabase 化する。
4. 顧客詳細閲覧、顧客編集、CSVインポート、CSVエクスポートを `audit_logs` 対象にする。
5. CSVエクスポートは owner 権限のみに限定する。

### 6-2. customer_notes

目的:
- カルテ、注意事項、メモを時系列で管理する。

手順:
1. 顧客詳細のメモ保存を `customer_notes` に寄せる。
2. 注意事項とカルテメモを分離するか、note_type で区別する。
3. 敏感な内容は参照権限を絞る。

## 7. import_jobs / audit_logs の実装手順

### 7-1. import_jobs

目的:
- CSVインポートの実行履歴を残す。

手順:
1. CSVインポート実行ごとに `import_jobs` を作る。
2. 対象データ種別、ファイル名、件数、成功・失敗件数を記録する。
3. 重複ファイルや再投入の判定に `source_file_hash` を使う。
4. まずはインポート成功後の集計保存から始める。

### 7-2. audit_logs

目的:
- 操作追跡と監査を行う。

対象:
- 顧客詳細閲覧
- 顧客編集
- CSVインポート
- CSVエクスポート

手順:
1. `audit_logs` を最初から使えるようにする。
2. `action_type`、`target_type`、`result`、`actor_role` を統一する。
3. 個人情報本文は残さない。
4. まずは owner / manager が参照できる形にする。

## 8. .env.local に必要な環境変数

最低限必要なもの:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

将来必要になりうるもの:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

注意:
- service role key はクライアントに絶対出さない。
- 本番投入前に `.env.example` と整合させる。

## 9. Supabaseクライアントの置き場所

推奨候補:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/types.ts`

理由:
- クライアント側とサーバー側を分けたい。
- 将来 RLS と Server Actions を併用しやすい。
- 認証・DBアクセスの責務を分けやすい。

## 10. localStorage版を一時的に残すかどうか

結論:
- 一時的には残す。

方針:
- まずは開発・検証用のフォールバックとして残す。
- Supabase 接続が安定した機能から順に localStorage を外す。
- 最終的には本番では localStorage を使わない。

理由:
- 既存の v0.1 の画面確認を壊しにくい。
- 機能単位で切り替えやすい。
- 移行中のトラブル時に戻しやすい。

## 11. ダミーデータだけで接続確認する手順

1. Supabase に最小スキーマを作る。
2. 本物の顧客情報は入れない。
3. staff、services、rooms にダミーデータだけ入れる。
4. shifts をダミーデータで少し入れる。
5. 予約を1件だけダミーで作る。
6. 予約一覧、作成、編集、キャンセルが DB 経由で動くか確認する。
7. 監査ログに最低限の操作が入るか確認する。
8. 顧客管理はまだ localStorage 側に残しておいてもよい。

## 12. 本物の顧客CSVを入れる前の条件

1. 顧客管理が Supabase で動く。
2. `audit_logs` が顧客詳細閲覧・顧客編集・CSVインポート・CSVエクスポートを記録する。
3. CSVエクスポートが owner 権限だけに制限されている。
4. 予約可否判定がサーバー側でも動く。
5. バックアップと復元手順が確認済みである。
6. RLS の方針が実装済み、または本番前に実装予定が確定している。
7. ダミーCSVで取り込み確認が済んでいる。
8. 個人情報保護法上の判断を専門家確認している。

## 13. 実装の切り分けメモ

- Phase 1: staff / services / rooms
- Phase 2: shifts / reservations / reservation_resources
- Phase 3: import_jobs / audit_logs
- Phase 4: customers / customer_notes
- Phase 5: localStorage の段階的削除

## 14. 補足

- ここでの順番は、リスクが低く、機能影響が読みやすい順です。
- 顧客管理は最後に置くことで、権限・ログ・CSV出力の土台を先に作れます。
- 実装時は、まずダミーデータで接続確認し、本物の顧客CSVは後回しにします。

