# Codex 独立セキュリティ・クロスチェック指示（このファイルの本文を Codex に貼る）

あなたは、別のAIが実施したセキュリティ監査を**独立して検証する**シニアセキュリティエンジニアです。
監査者に同意することがゴールではありません。**見落とし・過大評価・誤った修正・新たな脆弱性**を見つけることがゴールです。先行監査の結論を鵜呑みにせず、コードを自分で読んで確かめてください。

## 対象
- リポジトリ: `/Users/C.C/claude code/luxas-reservation-crm`（Next.js 15 App Router + Supabase / 現状 localStorage プロトタイプ、マルチテナントSaaSとして外販予定）
- 先行監査レポート: `docs/security-review-2026-06-22.md`（必ず最初に読む）
- 直近の修正コミット: `git log --oneline -8`（`89bbb10` 実害修正 / `45296c9` fail-closed＋ヘッダ / `20c97f2` safeHttpUrl改善）

## 必ず検証してほしい点（先行監査の主張）
1. **fail-closed認証**（`app/dashboard/layout.tsx`）: 本番(NODE_ENV=production)でSupabase未設定なら本当に `/login` へ送られ、管理画面が描画されないか。回避経路（直URL、ネストされたルート、`app/dashboard/**` 外の別レイアウト、API/route handler、`generateMetadata` 等）で認証を迂回できないか。`middleware.ts` 不在の影響も。
2. **CSV数式インジェクション修正**（`features/import-export/csv-utils.ts` `escapeCsvValue`）: `= + - @`・タブ・CR の中和は十分か。先頭の制御文字・全角・Unicode・改行混在・既に引用符を含むセルで漏れは無いか。逆に正当な負数(`-500`)が壊れる副作用の妥当性。
3. **URLスキームXSS修正**（`features/master-data/utils.ts` `safeHttpUrl`、利用箇所 `public-sidebar.tsx`/`home-view.tsx`）: `javascript:`/`data:`/`vbscript:` 以外に通る危険スキームは無いか（`\tjavascript:`、大文字、`java\nscript:`、`https:javascript:`、Unicodeエスケープ等）。`new URL()` 正規化で抜けは無いか。他に未ガードのURL/画像/iframe出力(`href`/`src`)が無いか全探索。
4. **オープンリダイレクト修正**（`app/auth/callback/route.ts` `resolveSafeNext`）: `//`、`/\`、`/%2F%2Fevil`、`/\t/evil`、エンコード経由、`new URL(next, origin)` の解釈差で外部遷移できないか。`exchangeCodeForSession` の扱いに問題は無いか。
5. **セキュリティヘッダ**（`next.config.ts`）: 値・対象パス(`/:path*`)・CSP `frame-ancestors` の妥当性。欠けている重要ヘッダ、過不足。

## 先行監査が「サーバー層前提で未対応」とした重大項目（再評価してほしい）
- 全データが localStorage（サーバー強制ゼロ）。会員ログインが localStorage の顧客ID偽装可能。mypageのIDOR。公開予約の濫用対策なし。`supabase/schema.sql` がRLS未設定・tenant_id無し。
- これらの**深刻度評価が妥当か**、また**先行監査が見落とした追加の脆弱性**（例: SSRF、ReDoS、プロトタイプ汚染、安全でない乱数によるID推測 `features/master-data/utils.ts` `makeLocalId`、CSVインポート側の検証、認可の抜け、依存の既知CVE）が無いかを自分で探す。

## 進め方・出力
1. まず `docs/security-review-2026-06-22.md` と該当ファイルを読む。
2. 上記を**コードで検証**（推測で同意/否定しない。再現条件を示す）。
3. `npm audit` が可能なら実行して依存の既知脆弱性を報告。
4. **コードは変更しない**（レビューのみ）。発見は次の形式で:
   - 重大度（Critical/High/Medium/Low）
   - 対象 file:line と現状の挙動
   - 攻撃の具体的な再現/PoC概要
   - 先行監査との差分（同意 / 過大評価 / 見落とし / 修正が不十分）
   - 推奨修正
5. 最後に「**先行監査で最も危ういと思う結論TOP3**」と「**先行監査が完全に見落としていた指摘**」を明記。

> 注意: `.env.local` の値は出力しない。個人情報・実トークンを貼り付けない。
