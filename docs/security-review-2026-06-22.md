# セキュリティレビュー（外販・SaaS化前提）2026-06-22

4領域（認証・セッション／データ分離・マルチテナント／シークレット・設定・依存／アプリ層脆弱性）を監査し、外部設定なしで直せる項目を実装した記録。本システムは現状 **localStorage プロトタイプ**（データは全てブラウザ保存・サーバー側強制なし）であり、外販SaaSにするには後述のサーバーデータ層＋RLSの構築が前提。

## 0. 最重要（ユーザー対応が必要・コードでは直せない）

1. **【至急】OpenAI APIキーのローテーション**: `.env.local` に実在の `sk-proj-...` キーがある。**git管理対象外（コミット履歴にも無し）で漏えいはしていない**が、ツール文脈で読み取られたため**無効化＆再発行を推奨**。保管場所(.env.local)は正しい。
2. **本番の核＝Supabase接続**: データ永続化・本格認証・RLSは Supabase プロジェクト作成＋`.env.local` への `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 設定が前提（現状 preview mode）。

## 1. 実装した修正（このセッション・push済み）

### 実害（現公開サイトで到達可能）— commit `89bbb10`
- **CSV数式インジェクション(CWE-1236)**: `features/import-export/csv-utils.ts` の `escapeCsvValue` で、先頭が `= + - @`・タブ・CR のセルにシングルクオートを付与。顧客名/メモ/注意事項など利用者入力がCSV出力されるため、Excel/Sheetsでの数式実行（情報窃取・コマンド実行）を防止。
- **URLスキームXSS**: 公開サイトのHP URL(`public-sidebar.tsx`)・店舗画像(`home-view.tsx`)を `safeHttpUrl()`（`features/master-data/utils.ts` 新設・**許可リスト方式**で http(s) のみ許可）でガード。`javascript:`/`data:`/`vbscript:` を遮断。外部リンクは `rel="noreferrer noopener"`。
- **オープンリダイレクト**: `app/auth/callback/route.ts` の `next` を `new URL()`＋同一オリジン検証で許可リスト化。`//evil.com` 等のプロトコル相対バイパスを遮断。`exchangeCodeForSession` の失敗を検査し、内部情報を出さずログイン誘導。

### 認証・ヘッダ堅牢化 — commit `45296c9`
- **fail-closed認証**: `app/dashboard/layout.tsx` で、Supabase未設定時の無認証プレビューを**開発環境(NODE_ENV!=="production")のみ**に限定。本番は必ず `/login` へ。env注入漏れ・誤設定で管理画面（顧客/予約/会計）が無認証全開放される fail-open を解消。`login-form.tsx` のプレビュー導線も開発環境のみ表示。
- **セキュリティヘッダ**: `next.config.ts` で全レスポンスに `X-Frame-Options: SAMEORIGIN`・`X-Content-Type-Options: nosniff`・`Referrer-Policy`・`Permissions-Policy`・`Strict-Transport-Security`・`Content-Security-Policy: frame-ancestors 'self'` を付与。

## 2. 監査で確認した良好点
- `service_role` キーはクライアント/サーバーいずれにも露出なし。Supabaseクライアントは anon キーのみ。
- サーバー認証は `getUser()`（検証あり）を使用。`getSession()`（cookie盲信）は不使用。
- `dangerouslySetInnerHTML`/`eval`/`innerHTML` は皆無。動的値は全てJSXエスケープ。
- 顧客PIIを第三者へ送信していない（天気=店舗座標のみ、地図=店舗住所のみ、メール/SMSはモックで実送信なし）。
- `.gitignore` は `.env*` を網羅、シークレットのコミット履歴なし。依存は小さくlockfileあり。

## 3. 未対応（サーバーデータ層が前提・外販前に必須）

これらは **localStorage プロトタイプである限り「設計上の負債」で、Supabase移行時に必ず実装が必要**。現状はサーバーが無いため即時の実被害は限定的だが、サーバー化した瞬間に脆弱性になる。

| 重大度 | 項目 | 内容 |
|---|---|---|
| CRITICAL | サーバーデータ層が無い | 予約/顧客PII/カルテ/会計が全てブラウザ localStorage（41キー・46利用箇所）。サーバー強制ゼロ。 |
| CRITICAL | テナント分離なし | `supabase/schema.sql` は store_id 列ありだが **RLS未設定・tenant_id/areas列なし**。デプロイすると anon キーで全テナント素通し。 |
| CRITICAL | 顧客PII/カルテが全件グローバル | `caution`/`chartMemo`（医療隣接情報）含め店舗/テナント絞りなしで全ロード。APPI(個人情報保護法)観点で要対応。 |
| CRITICAL | 会員ログインが偽装可能 | `use-member-session.ts`＝localStorageのID文字列のみ。`handleGuestLogin` はメール存在のみでパスワード未検証。任意顧客になりすまし可能。 |
| CRITICAL | IDOR | mypageの予約キャンセル/変更/会員更新が id 指定で所有権再検証なし。サーバー化で他人のデータ改変が成立。 |
| HIGH | 公開予約の濫用対策なし | 認証/レート制限/CAPTCHA/サーバー側空き再検証なし。サーバー化で大量作成・枠占有・顧客レコード乗っ取り。 |
| HIGH | currentStoreId がクライアント可変 | `use-current-store.ts`＝localStorage値。認証セッションから店舗/テナントを導出していない。 |
| HIGH | 「店舗スコープ」は画面フィルタのみ | `store-scope.ts` 等は読込済みデータの `.filter()`。サーバー制約クエリではない。 |
| MEDIUM | 完全CSP未設定 | nonce配布(middleware)が前提。スクリプト制限CSPは未導入。 |
| MEDIUM | middleware.ts 無し | エッジでの fail-closed ゲート／Supabaseセッション更新が無い。 |

## 4. 外販に向けた推奨ロードマップ（優先順）

1. **【至急】OpenAIキーをローテーション**（ユーザー作業）。
2. **Supabaseバックエンド構築**（ユーザーのプロジェクト作成＋env）→ 全データを Postgres へ移し、クライアントを source of truth から外す。
3. **スキーマに `tenants`/`areas` テーブルと全テーブル `tenant_id` 追加 ＋ 全テーブルRLS有効化**。ポリシーは `auth.uid()`→`users`/`user_roles` 経由でテナント/店舗を導出（クライアント値は使わない）。`caution`/`chartMemo`/CSV出力は列・ロール単位ポリシー＋`audit_logs`（既存・未使用）への記録。
4. **認証を Supabase 由来に**: 会員/管理ともサーバーセッションから identity 導出。会員ログインのパスワード検証、管理は RBAC。
5. **サーバー側の認可・入力検証**: 予約作成/キャンセル/会員更新で所有権チェック、空き枠のサーバー再検証、レート制限＋CAPTCHA、Zod等で全入力を許可リスト検証。クライアント送信の `status/customerId/staffId/storeId` は信用せずサーバー導出。
6. **middleware.ts**＋nonce付き完全CSP、監査ログ、メール/SMS実装時のサーバー専用シークレット管理とPII再レビュー。

## 5. テスト/確認
- 実装修正は `npx tsc --noEmit` / `npm run lint` クリーン、主要ルート200。
- セキュリティヘッダは dev 再起動後／本番ビルドで反映（curl確認は再起動後）。
- 自動セキュリティテストは未整備（要: open-redirect/CSV/認可の回帰テスト追加）。
