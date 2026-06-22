# LUXAS 予約・顧客管理システム セキュリティレビュー（外販・SaaS化前提）

- 日付: 2026-06-22
- 対象: `/Users/C.C/claude code/luxas-reservation-crm`（Next.js 15 App Router + Supabase / 現状 localStorage プロトタイプ）
- 目的: マルチテナントSaaSとして外販する前提で、攻撃される前提でも壊れにくい構造かを全面監査し、外部設定なしで直せる項目を実装する。
- 監査範囲: ①認証・セッション ②データ分離・マルチテナント ③シークレット・設定・依存 ④アプリ層脆弱性・入力検証

> 結論（先に）: **現状はデータが全てブラウザの localStorage に保存され、サーバー側のアクセス制御が一切ない**プロトタイプ。「店舗スコープ」も画面上のフィルタにすぎない。このままでは外販不可。今回、**現公開サイトで到達可能な実害2件を修正**し、**本番化前提の認証 fail-closed 化＋セキュリティヘッダ**を実装した。本丸（テナント分離・RLS・本格認証）は Supabase バックエンド構築が前提。

---

## 0. 最優先アクション（コードでは直せない・ユーザー対応）

1. **【至急】OpenAI APIキーのローテーション**: `.env.local` に実在の `sk-proj-...` キーがある。**git管理対象外（履歴にも無し）で漏えいはしていない**が、無効化＆再発行を推奨。保管場所(.env.local)は正しい。
2. **本番の核＝Supabase接続**: データ永続化・本格認証・RLSは Supabase プロジェクト作成＋`.env.local` への `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 設定が前提（現状 preview mode）。
3. **`npm audit` の実行**: ネットワーク制約で今回未実行。オンライン環境で実行し依存脆弱性を確認。

---

## 1. 今回実装した修正（すべて main に push 済み・`npx tsc --noEmit`/`npm run lint` クリーン）

### commit `89bbb10` — 公開サイトの実害脆弱性（現状で到達可能）
- **CSV数式インジェクション (CWE-1236)** — `features/import-export/csv-utils.ts` `escapeCsvValue`
  - 先頭が `= + - @`・タブ・CR のセルにシングルクオートを付与して無害化。
  - 顧客名・メモ・注意事項など利用者入力がCSV出力されるため、Excel/Sheets で開くと数式が実行され情報窃取/コマンド実行の恐れがあった。**現公開サイトの予約者名から到達可能**だった実害。
- **URLスキームXSS** — `features/online-booking/public-sidebar.tsx`（HP URL）, `features/online-booking/home-view.tsx`（店舗画像）
  - 新ヘルパー `safeHttpUrl()`（`features/master-data/utils.ts`）で **http(s) のみ許可（許可リスト方式）**。`javascript:` / `data:` / `vbscript:` を遮断。
  - 外部リンクは `rel="noreferrer noopener"`。
- **オープンリダイレクト** — `app/auth/callback/route.ts`
  - `next` を `new URL()`＋同一オリジン検証で許可リスト化し、`//evil.com` 等のプロトコル相対バイパスを遮断。
  - `exchangeCodeForSession` の失敗を検査し、内部情報を返さずログインへ誘導。

### commit `45296c9` — 認証 fail-closed 化＋セキュリティヘッダ
- **fail-closed認証** — `app/dashboard/layout.tsx`
  - Supabase未設定時の無認証プレビューを **開発環境(`NODE_ENV!=="production"`)のみ** に限定。本番は必ず `/login` へ。
  - これにより、env注入漏れ・誤設定で **管理画面（顧客/予約/会計）が無認証で全開放される fail-open** を解消。
  - `components/auth/login-form.tsx` の「管理画面プレビューを開く」導線も開発環境のみ表示。
- **セキュリティレスポンスヘッダ** — `next.config.ts`（全レスポンス）
  - `X-Frame-Options: SAMEORIGIN`（クリックジャッキング）/ `X-Content-Type-Options: nosniff` / `Referrer-Policy: strict-origin-when-cross-origin` / `Permissions-Policy: camera=(),microphone=(),geolocation=(),payment=()` / `Strict-Transport-Security: max-age=31536000; includeSubDomains` / `Content-Security-Policy: frame-ancestors 'self'`。
  - ※ スクリプト制限の完全CSPは nonce 配布(middleware)が前提のため後続課題。ヘッダは dev 再起動／本番ビルドで反映。

### commit `767c4f1` / 本ファイル — レビュー記録

---

## 2. 監査の詳細所見

### ① 認証・セッション
- **CRITICAL**: `/dashboard` が preview mode（Supabase未設定）で完全ノーガード。`app/dashboard/layout.tsx` が `if (configured)` でのみ認証チェックし、未設定時は `preview@luxas.local` で全描画。ログイン画面に「管理画面プレビューを開く」リンクまであった。→ **本セッションで fail-closed 化して解消**（本番のみ）。
- **CRITICAL（会員領域）**: 公開予約サイトの会員ログインは `localStorage["luxas-book-member-id"]` の文字列のみ。`handleGuestLogin` は**メール存在のみでパスワード未検証**、`pickDemoMemberId` は任意顧客を選べる。誰でも devtools で任意顧客になりすまし、PII閲覧・予約改ざんが可能。→ **サーバー認証が前提のため未対応**（プロトタイプの設計限界）。
- **HIGH**: `middleware.ts` が存在せず、エッジでの fail-closed ゲート／Supabaseセッション更新が無い。
- **HIGH**: 「認証ON/OFF」を公開env変数の有無で判定していた（fail-openの根因）。→ fail-closed 化で緩和。
- **MEDIUM**: OAuthコールバックの open-redirect ガードが `startsWith("/")` のみで `//` を通す＋ exchange 結果未検査。→ **修正済**。
- 良好: `service_role` キーはどこにも露出なし。anonキーのみ。サーバーは `getUser()`（検証あり）使用、`getSession()` 不使用。

### ② データ分離・マルチテナント
- **CRITICAL**: サーバーデータ層が無い。`features/master-data/local-storage.ts` の `useLocalCollection` が唯一の永続化で、**41種の `luxas-*` キー・46利用箇所**に予約/顧客PII/スタッフ/会計が全てブラウザ保存。Supabaseは認証(`auth.*`)のみ使用しデータCRUDはゼロ。
- **CRITICAL（PII）**: 顧客が店舗/テナント絞りなしで全件ロード（`customer-manager.tsx`）。`caution`/`chartMemo`（医療隣接の注意事項・カルテ）含む。APPI(個人情報保護法)観点で要対応。
- **CRITICAL（スキーマ）**: `supabase/schema.sql` は store_id 列ありだが **RLS未設定・`tenant_id`/`areas` 無し**。デプロイすると anon キーで全テナント素通し（Supabaseはデフォルトでテーブル全開放）。
- **HIGH**: `currentStoreId` は `use-current-store.ts` の localStorage 値でユーザーが自由に変更可能。認証セッションから店舗/テナントを導出していない。
- **HIGH**: 「店舗スコープ」(`store-scope.ts` 等)は読込済みデータの `.filter()` ＝画面フィルタのみ。「storeId未設定→既定店舗に表示」のフォールバックは漏えい/誤表示の footgun。

### ③ シークレット・設定・依存
- **CRITICAL（要ローテーション）**: `.env.local` に実在 OpenAI キー（git管理外・履歴に無し・漏えいなし。再発行推奨）。
- **MEDIUM**: セキュリティヘッダが全く無かった（CSP/HSTS/X-Frame-Options等）。→ **本セッションで付与**。
- 良好: `.gitignore` は `.env*` 網羅。コミット履歴にシークレット無し。`dangerouslySetInnerHTML` 皆無。依存は小さくlockfileあり。
- 注意（運用）: `scripts/ask-chatgpt.mjs` は `--file` で渡したファイルをOpenAIへ送る。**顧客データを渡さない**運用ルールを徹底。
- 注意: メール/SMSは現状モックで実送信なし＝PIIは外部に出ていない。実プロバイダ(SendGrid/Twilio等)連携時にサーバー専用シークレット管理とPII再レビューが必要。

### ④ アプリ層脆弱性・入力検証
- **MEDIUM（実害）**: CSV数式インジェクション。→ **修正済**。
- **MEDIUM（実害）**: `href={settings.hpUrl}` のスキーム未検証で `javascript:` XSS。→ **修正済**。`<img src>` も同様にガード済。
- **MEDIUM**: open-redirect（`//host`）。→ **修正済**。
- **CRITICAL（サーバー化時）**: 公開予約 `confirm()` がクライアント構築のレコードをそのまま保存。サーバー化すると `status/customerId/staffId/storeId` を任意指定可能・空き判定がクライアントのみ・レート制限/CAPTCHA無しで大量作成や枠占有が成立。
- **CRITICAL（サーバー化時）**: mypage の予約キャンセル/変更/会員更新が id 指定で所有権再検証なし＝IDOR。
- 良好: Google Maps 埋め込みは固定ベース＋`encodeURIComponent` で安全。`.ics` 生成は RFC5545 エスケープ済。

---

## 3. 残課題（localStorageプロトタイプである限り解消不可・Supabaseバックエンド前提）

| 重大度 | 項目 |
|---|---|
| CRITICAL | サーバーデータ層が無い（全データ localStorage） |
| CRITICAL | テナント分離なし（RLS未設定・tenant_id無し） |
| CRITICAL | 顧客PII/カルテが全件グローバル（医療隣接情報・APPI） |
| CRITICAL | 会員ログイン偽装可能（パスワード未検証・localStorage ID） |
| CRITICAL | IDOR（mypageの予約/会員操作で所有権チェックなし） |
| HIGH | 公開予約の濫用対策なし（認証/レート制限/CAPTCHA/サーバー側空き再検証） |
| HIGH | currentStoreId がクライアント可変 |
| HIGH | 店舗スコープが画面フィルタのみ |
| MEDIUM | 完全CSP（nonce/ middleware）未導入 |
| MEDIUM | middleware.ts 無し／監査ログ未使用 |

---

## 4. 外販に向けた推奨ロードマップ（優先順）

1. **【至急・ユーザー】OpenAIキーをローテーション**。
2. **【ユーザー】Supabaseプロジェクト作成＋`.env.local` に2行**（本格認証/RLSの土台）。
3. **【実装可・SQLのみ先行】スキーマに `tenants`/`areas` ＋ 全テーブル `tenant_id` 追加 ＋ 全テーブルRLS有効化**。ポリシーは `auth.uid()`→`users`/`user_roles` 経由でテナント/店舗導出（クライアント値は使わない）。`caution`/`chartMemo`/CSV出力は列・ロール単位ポリシー＋`audit_logs`（既存・未使用）への記録。
4. **【実装】データ層を localStorage→Supabase へ移行**（source of truth をサーバーへ）。
5. **【実装】サーバー側の認可・入力検証**: 予約作成/キャンセル/会員更新で所有権チェック、空き枠のサーバー再検証、レート制限＋CAPTCHA、Zod等で許可リスト検証。クライアント送信の `status/customerId/staffId/storeId` は信用せずサーバー導出。会員ログインのパスワード検証、管理は RBAC。
6. **【実装】middleware.ts ＋ nonce付き完全CSP、監査ログ、メール/SMS実装時のサーバー専用シークレット管理とPII再レビュー**。

---

## 5. テスト/確認状況
- 実装修正は `npx tsc --noEmit` / `npm run lint` クリーン、主要ルート(login/dashboard/book/map) 200。
- 開発環境ではプレビュー継続＝既存の作業フローは不変。
- セキュリティヘッダは **dev再起動／本番ビルド後に反映**（稼働中devを止めない方針のため未再起動）。curl検証は再起動後に可。
- 自動セキュリティ回帰テスト（open-redirect/CSV/認可）は未整備＝今後の課題。
- `npm audit` はネットワーク制約で未実行。

## 6. 変更ファイル一覧（今回）
- `features/import-export/csv-utils.ts`（CSV無害化）
- `features/master-data/utils.ts`（`safeHttpUrl` 新設）
- `features/online-booking/public-sidebar.tsx` / `features/online-booking/home-view.tsx`（URL/画像ガード）
- `app/auth/callback/route.ts`（open-redirect/エラー処理）
- `app/dashboard/layout.tsx`（fail-closed）
- `components/auth/login-form.tsx`（プレビュー導線を開発限定）
- `next.config.ts`（セキュリティヘッダ）
- `docs/security-review-2026-06-22.md`（本ファイル）

関連コミット: `89bbb10`（実害修正）/ `45296c9`（fail-closed＋ヘッダ）/ `767c4f1`（本ファイル初版）。

---

## 7. Codex 独立クロスチェックと追加対応

別エージェント(Codex)に `docs/codex-security-crosscheck-prompt.md` で**反証レビュー**を依頼。先行監査の見落とし/不十分を指摘させ、各指摘をコードで再現確認のうえ対応した。

### 検証で有効と確認し**修正した**指摘
- **CRITICAL: 管理画面の認可抜け（権限昇格）** — `app/dashboard/layout.tsx`
  - `/dashboard` は `getUser()`（認証）のみ確認。公開予約サイトと**同じ Supabase Auth** を共有するため、顧客のOAuthアカウントでも管理画面に入れてしまう。先行監査は「認証」評価で「認可」を見落としていた。
  - **対応** `cb89c83`: サーバー専用の許可リスト `STAFF_EMAIL_ALLOWLIST` でスタッフ/管理者のみ許可。許可外は `/login?error=forbidden`。本番で未設定は fail-closed。恒久対応は `users/user_roles` の RBAC（DB/RLS後）＋Supabaseの公開サインアップ無効化。
- **HIGH: Service Worker が root スコープで管理画面ナビゲーションまでキャッシュ** — `features/online-booking/pwa-client.tsx` / `public/sw.js`
  - 既定スコープ `/` ＋ 全ナビゲーションキャッシュ。先行監査は完全に見落とし。
  - **対応** `5682eb2`: 登録を `scope: "/book/"` に限定、sw.js も `/book/` 配下のみ対象化、会員ページ(`/book/*/mypage`)はキャッシュ除外。
- **MEDIUM: CSV数式インジェクションの境界値漏れ** — `features/import-export/csv-utils.ts`
  - 先頭の LF/BOM/空白で数式トリガを隠す回避（`"\n=1+1"`, BOM+`=1+1`）が中和されていなかった。
  - **対応** `5682eb2`: 先頭の制御文字(C0)/BOM/空白も判定して中和。単体テストで全ケース確認。
- **（自己チェック）`safeHttpUrl` の過剰拒否** — `20c97f2` で裸ドメインに `https://` 補完（危険スキームは拒否）。

### 同意（対応はロードマップどおり・DB前提）
- **CRITICAL: `supabase/schema.sql` が RLS未実装・tenant_id無し** — 先行監査と一致。ロードマップ3で対応。

### 記録（フレームワーク更新が必要・今回はブラインド更新しない）
- **MEDIUM: 依存の既知脆弱性** — `npm audit --omit=dev` で **postcss <8.5.10 の Moderate XSS（GHSA-qx2v-qp2m-jg93）が Next 同梱経由で2件**。High/Critical は0。`npm audit fix --force` は next を 9.x へダウングレードする誤修正のため不可。**正しくは Next の安全なパッチ版へ更新**だが、回帰テスト無しのフレームワーク更新はリスクのため、CI/検証環境での `npm update next`（または overrides で postcss 固定）＋再auditを推奨。本XSSはビルド時CSS処理の話で当アプリの実行時導線は限定的。

### Codex 検証で「概ねOK」とされた点
- `safeHttpUrl()` は `javascript:`/`data:`/`vbscript:`/タブ・改行混入/大文字/`https:javascript:` を拒否。
- `resolveSafeNext()` は `//evil` / `/\evil` / `/%2F%2Fevil` / `/\t/evil` を外部遷移にできず。
- 未設定本番での `/dashboard` 直URL迂回・route handler 経由の抜けは見当たらず（route handler は `app/auth/callback` のみ）。

### この時点の残課題（外販前・DB/インフラ前提）
1. **RBAC本実装**: `users/user_roles` 参照、公開会員と管理者のロール分離、middleware で同一判定共有、Supabase公開サインアップ無効化。
2. **RLS＋tenant_id**（ロードマップ3）。
3. **データ層 localStorage→Supabase 移行**＋サーバー側の認可・所有権・入力検証・レート制限。
4. **依存更新**（Next/postcss）と CI への `npm audit` 組み込み。
5. nonce付き完全CSP、監査ログ、メール/SMS実装時のPII再レビュー。

クロスチェック関連コミット: `5682eb2`（SW/CSV）/ `cb89c83`（管理画面RBAC暫定）/ `20c97f2`（safeHttpUrl改善）。

---

## 8. Codex 第2回クロスチェックと追加対応

第2回で「前回の大穴はかなり塞がった」評価。残る3点（いずれも Medium）をコードで再現確認のうえ修正。

- **認可拒否のリダイレクトループ**（`5682eb2`の認可対応の副作用）→ `bd41725`: allowlist外ユーザーが `/login?error=forbidden`→`/dashboard`→…で無限ループ。`app/login/page.tsx` を `error=forbidden` 時は自動リダイレクトせず、`components/auth/forbidden-notice.tsx`（権限なし案内＋ログアウト導線）を表示するよう修正。
- **旧rootスコープ Service Worker の移行漏れ** → `bd41725`: 既存ブラウザに残る `/` スコープ旧SWと旧キャッシュ(v1)を、`pwa-client.tsx` の getRegistrations で unregister＋`public/sw.js` のキャッシュ名を v2 に上げ activate で旧キャッシュ削除。
- **店舗別KPI/会計の非スコープ混入（最重要）** → `50c1e42`: 日次目標(DailyTarget)・物販売上(RetailSale)・売上日報が店舗スコープされておらず店舗間で混入（日次目標は日付キーのみで衝突）。汎用ヘルパー `features/master-data/store-record-scope.ts` を新設し、storeId 付与＋現在店舗で絞り込み（top-kpi/ledger/analytics/daily-ops/retail-sales/monthly-shift-grid）。未設定の既存データは既定店舗扱い＝非破壊。

### Codex 第2回で「OK」とされた点
- CSV無害化（LF/BOM/先頭空白まで中和。全角＝は数式トリガでないため許容）、`safeHttpUrl`/`resolveSafeNext` の主要バイパス耐性、`/dashboard/**` の共通layout経由の迂回なし。

### この時点の残課題（外販前・DB/インフラ前提は不変）
- 本丸（localStorage全保存・会員偽装・IDOR・RLS未実装・公開予約の濫用対策なし）は未解消＝Supabaseバックエンド前提。
- daily-ops の出勤/レジ金/経費/日報レコード自体は date キーのみで未スコープ（運用記録・別途対応）。
- 依存（Next/postcss Moderate）の更新、nonce付き完全CSP、middleware、監査ログ。

第2回関連コミット: `bd41725`（ループ/SW移行）/ `50c1e42`（店舗スコープ完成）。
