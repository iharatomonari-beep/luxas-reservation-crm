# LUXAS予約・顧客管理システム セキュリティ実装計画

この文書は、[docs/security-policy.md](./security-policy.md) を前提に、本番化前に必要なセキュリティ実装を優先順位付きで整理したものです。

注意:
- ここでいう「本番」は、実際の顧客データを運用する環境を指します。
- `localStorage` ベースの現行プロトタイプは検証用であり、本番実装の対象ではありません。
- 個人情報保護法や関連ガイドラインの最終判断は、必ず専門家確認が必要です。

## 1. 優先順位の考え方

- **P0**: 本番前に必須。未実施では顧客データ運用を始めない。
- **P1**: 早期に必要。P0 の土台ができ次第、運用の安定化のために実装する。
- **P2**: 将来対応。初期運用には不要だが、拡張時に必要になる。

## 2. P0: 本番前に必須

### 2-1. ロール別権限の基盤を作る

目的:
- 顧客情報、カルテ、注意事項、予約履歴、売上情報の閲覧範囲を役割ごとに分ける。
- CSV出力や設定変更を上位ロールに限定する。

実装対象ファイルや画面の候補:
- `app/dashboard/layout.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/dashboard-shell.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/customers/page.tsx`
- `app/dashboard/reservations/page.tsx`
- `app/dashboard/import-export/page.tsx`
- `features/customers/customer-manager.tsx`
- `features/reservations/reservation-ledger.tsx`
- `features/import-export/import-export-manager.tsx`
- 将来追加する `lib/auth/*` または `lib/rbac/*`

Supabase接続後に実装するもの:
- Supabase Auth のセッション取得
- ロール情報のDB同期
- RLS での行レベル制御

localStorage版では実装しないもの:
- 実ユーザー認証
- サーバー側の権限制御
- RLS による本格的なデータ分離

完了条件:
- 画面単位で「誰が何を見られるか」を定義済みである。
- 管理者、受付、施術担当などの表示差分が設計に入っている。
- CSV出力と売上系閲覧の制限方針が文書化されている。

### 2-2. CSV出力制限を実装する

目的:
- 個人情報と業務上センシティブな情報の外部持ち出しを抑える。
- 誰でも全件CSVを出せる状態を避ける。

実装対象ファイルや画面の候補:
- `features/import-export/import-export-manager.tsx`
- `features/import-export/csv-utils.ts`
- `app/dashboard/import-export/page.tsx`
- `components/layout/sidebar.tsx`
- `docs/sample-csv/*`

Supabase接続後に実装するもの:
- ロールに応じた出力可否判定
- 出力履歴の永続保存
- 監査用ログとの連携

localStorage版では実装しないもの:
- 本人確認を伴うダウンロード承認
- サーバー側の出力監査

完了条件:
- 出力対象が役割で制限される。
- 顧客明細、カルテ、売上を含むCSVは上位ロール限定になる。

### 2-3. 顧客詳細閲覧ログと顧客編集ログを残す

目的:
- 顧客情報の参照・変更を追跡できるようにする。
- 不正閲覧や誤操作の追跡を可能にする。

実装対象ファイルや画面の候補:
- `features/customers/customer-manager.tsx`
- `app/dashboard/customers/page.tsx`
- 将来追加する `features/audit/*`
- 将来追加する `lib/audit/*`

Supabase接続後に実装するもの:
- ログのDB保存
- 実行者、対象顧客ID、操作種別の永続化
- ログ検索画面

localStorage版では実装しないもの:
- 改ざん耐性のある監査ログ
- 端末をまたいだ参照履歴保存

完了条件:
- 顧客詳細を開いた事実が記録対象として定義されている。
- 顧客編集の前後差分または編集イベントが残る設計になっている。

### 2-4. CSVインポートログとCSVエクスポートログを残す

目的:
- どのCSVを、誰が、いつ、何件取り込んだかを追跡する。
- 誤った取り込みや大量出力の調査を可能にする。

実装対象ファイルや画面の候補:
- `features/import-export/import-export-manager.tsx`
- `features/import-export/csv-utils.ts`
- `app/dashboard/import-export/page.tsx`
- 将来追加する `features/audit/*`

Supabase接続後に実装するもの:
- インポート・エクスポート履歴の永続保存
- 件数、対象種別、成功/失敗の記録

localStorage版では実装しないもの:
- 改ざん防止付きの操作ログ
- 管理画面外からの出力追跡

完了条件:
- 顧客CSV、スタッフCSV、メニューCSV、予約CSV、PeakManager顧客明細CSVの取り込み履歴が追える設計になっている。

### 2-5. 退職者アカウント停止を実装する

目的:
- 退職者や利用停止者のアクセスを速やかに止める。
- 退職後の権限残存を防ぐ。

実装対象ファイルや画面の候補:
- `app/dashboard/staff/page.tsx`
- `features/master-data/staff-manager.tsx`
- 将来追加する `lib/auth/*`
- 将来追加する `features/users/*`

Supabase接続後に実装するもの:
- アカウント無効化フラグ
- ログイン停止
- セッション失効

localStorage版では実装しないもの:
- 実アカウントの停止処理

完了条件:
- スタッフ情報に有効/無効の管理方針があり、無効化時の運用が決まっている。

### 2-6. バックアップと復元手順を本番用に固める

目的:
- データ消失や誤更新から復旧できるようにする。

実装対象ファイルや画面の候補:
- `docs/deployment-checklist.md`
- `docs/security-policy.md`
- `docs/security-implementation-plan.md`
- 将来追加する運用手順書

Supabase接続後に実装するもの:
- DBバックアップ
- 復元テスト
- 世代管理

localStorage版では実装しないもの:
- 本番バックアップの自動化
- 復元テストの運用監査

完了条件:
- バックアップ周期、保管先、復元手順、復元テストの責任者が決まっている。

### 2-7. 大量データ取り込み制限を設ける

目的:
- 誤インポート、処理負荷、意図しない大量更新を防ぐ。

実装対象ファイルや画面の候補:
- `features/import-export/import-export-manager.tsx`
- `features/import-export/csv-utils.ts`
- `app/dashboard/import-export/page.tsx`

Supabase接続後に実装するもの:
- 一回あたりの取り込み上限
- キュー処理
- 管理者承認フロー

localStorage版では実装しないもの:
- 非同期バッチ処理
- 大規模インポートの再実行制御

完了条件:
- 取り込み前プレビューで件数上限を確認できる。
- 上限超過時は取り込みを止める設計になっている。

### 2-8. 本物の顧客CSVを入れる条件を定義する

目的:
- サンプルCSVと本番CSVの境界を明確にする。
- 取り込み前の確認漏れを防ぐ。

実装対象ファイルや画面の候補:
- `docs/sample-csv/README.md`
- `docs/security-policy.md`
- `docs/manual-check-notes.md`
- `app/dashboard/import-export/page.tsx`

Supabase接続後に実装するもの:
- 本番CSV取り込み申請の承認
- マスキング済みサンプルとの区別

localStorage版では実装しないもの:
- 本番CSVの自動受け入れ

完了条件:
- 本物CSVを入れてよい条件が文書化されている。
- 個人情報が削除済みか、承認済みかを確認する手順がある。

## 3. P1: 早期に必要

### 3-1. 顧客詳細の閲覧範囲を項目単位で整理する

目的:
- 顧客詳細画面で、ロールに応じて見せる項目を細かく分ける。

実装対象ファイルや画面の候補:
- `features/customers/customer-manager.tsx`
- `app/dashboard/customers/page.tsx`

Supabase接続後に実装するもの:
- 項目単位の表示制御

localStorage版では実装しないもの:
- サーバー側の項目別マスキング

完了条件:
- 会員番号、ランク、総来店回数、売上、取消、無断キャンセルなどの表示ルールが役割ごとに整理されている。

### 3-2. 予約履歴・顧客履歴の参照ログを拡張する

目的:
- 予約台帳や顧客詳細へのアクセスも追跡対象にする。

実装対象ファイルや画面の候補:
- `features/reservations/reservation-ledger.tsx`
- `features/customers/customer-manager.tsx`

Supabase接続後に実装するもの:
- 顧客詳細閲覧ログ
- 予約台帳閲覧ログ
- ロール別の参照傾向集計

localStorage版では実装しないもの:
- 永続的なアクセス解析

完了条件:
- 主要な参照イベントの記録項目が定義されている。

### 3-3. 監査ログの保管期間と削除ルールを決める

目的:
- ログを無期限にためない。
- 監査と個人情報保護のバランスを取る。

実装対象ファイルや画面の候補:
- `docs/security-policy.md`
- `docs/deployment-checklist.md`
- 将来追加する `docs/retention-policy.md`

Supabase接続後に実装するもの:
- ログ保管期間設定
- 自動削除

localStorage版では実装しないもの:
- 自動削除のサーバー実行

完了条件:
- ログ種別ごとの保管期間が決まっている。

### 3-4. CSV出力の承認フローを整える

目的:
- 誰でも自由に全件出力しない運用にする。

実装対象ファイルや画面の候補:
- `app/dashboard/import-export/page.tsx`
- `features/import-export/import-export-manager.tsx`

Supabase接続後に実装するもの:
- 上長承認
- 出力理由の記録

localStorage版では実装しないもの:
- 承認ワークフロー

完了条件:
- CSV出力に理由と責任者を紐づける方針がある。

## 4. P2: 将来対応

### 4-1. 項目単位の厳密なアクセス制御

目的:
- 顧客情報のうち、特にセンシティブな項目をさらに細かく制御する。

候補ファイル:
- `lib/rbac/*`
- `features/customers/customer-manager.tsx`
- `features/reservations/reservation-ledger.tsx`

Supabase接続後に実装するもの:
- フィールド単位のマスキング
- 条件付き編集制御

localStorage版では実装しないもの:
- 端末だけで完結する厳密制御

完了条件:
- 情報の見せ方を項目単位で切り替えられる。

### 4-2. 操作ログの検索・分析画面

目的:
- ログを読むだけでなく、検索して異常を見つけやすくする。

候補ファイル:
- `app/dashboard/audit/page.tsx`
- `features/audit/*`

Supabase接続後に実装するもの:
- ログ検索
- CSV監査
- 異常操作の可視化

localStorage版では実装しないもの:
- ログ分析UI

完了条件:
- 操作ログを日付、ユーザー、操作種別で検索できる。

### 4-3. 端末・IP・MFA などの追加防御

目的:
- 管理画面の不正利用リスクを下げる。

候補ファイル:
- `lib/auth/*`
- `components/layout/*`

Supabase接続後に実装するもの:
- 多要素認証
- 端末識別
- 必要に応じたIP制限

localStorage版では実装しないもの:
- 実運用の端末認証

完了条件:
- 高権限ロールに追加防御がかかる。

### 4-4. バックアップ監査と復元演習の定期化

目的:
- バックアップがあるだけでなく、戻せることを確認する。

候補ファイル:
- `docs/deployment-checklist.md`
- `docs/security-policy.md`

Supabase接続後に実装するもの:
- 定期復元演習
- 記録の保管

localStorage版では実装しないもの:
- 自動演習

完了条件:
- 復元演習の実施履歴が残る。

## 5. 実装順序

1. ロール別権限の基盤を固める。
2. CSV出力制限を入れる。
3. 顧客詳細閲覧ログと顧客編集ログを定義する。
4. CSVインポートログとCSVエクスポートログを定義する。
5. 退職者アカウント停止の運用を決める。
6. バックアップと復元手順を固める。
7. 大量データ取り込み制限を決める。
8. 本物の顧客CSVを入れる条件を明文化する。
9. その後に P1 の項目単位制御やログ検索を進める。

## 6. localStorage版では実装しないもの

- 実ユーザー認証
- サーバー側の権限管理
- Supabase Auth の接続
- RLS による行レベル保護
- 本番監査ログの永続化
- 本番バックアップ
- 退職者アカウント停止の実運用
- CSV出力の承認ワークフロー
- 大量インポートのキュー処理
- 本物CSVの本番運用取り込み

## 7. Supabase接続後に実装するもの

- Supabase Auth によるログイン
- ロールのDB管理
- RLS によるデータ保護
- 顧客・予約・売上・ログの永続保存
- CSV取り込み・出力ログの永続保存
- 退職者アカウント停止
- バックアップと復元運用
- CSV出力承認フロー
- 顧客詳細閲覧ログ
- 顧客編集ログ
- 大量データ取り込み制限
- 本物の顧客CSVを扱う本番運用

## 8. 完了条件

- 本番前必須の P0 項目が設計と実装計画に落ちている。
- `localStorage` で完結する検証実装と、本番必須の実装が混同されていない。
- ロール別権限、CSV出力制限、操作ログ、退職者対応、バックアップ、取り込み制限の順序が明確である。
- 本物の顧客CSVを入れる条件が文書化されている。
- 本番化前に専門家確認が必要な点が明示されている。

