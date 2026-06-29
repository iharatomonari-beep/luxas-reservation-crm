# Supabase 接続ランブック（第2区切り・実行用）

最終更新: 2026-06-26 / 対象: LUXAS 予約・顧客管理 v0.1

このファイルは「Supabase を実際に繋ぐ」ための実行手順です。`supabase-setup-guide.md`（スキーマ準備の概念編）の後継・具体編にあたります。

---

## 0. 最重要の事実（着手前に必ず理解する）

実コードを確認した結果、現状はこうです。

- **認証（ログイン）は結線済み。** `.env.local` に Supabase の URL と anon キーを入れると、`isSupabaseConfigured()` が true になり、アプリは**自動で本認証モードに切り替わる**（`app/dashboard/layout.tsx`／`components/auth/login-form.tsx`／`app/auth/callback/route.ts`）。コード変更は不要。
- **業務データ（予約・顧客・会計・マスタ等）は、繋いだ後も当面 localStorage のまま。** Supabase に接続しても、画面の読み書きは localStorage を使い続けます。**「複数端末で同じデータを共有」はこの作業だけでは実現しません**。それは別フェーズ（`supabase-migration-plan.md`／データ層の差し替え）です。
- したがってこの作業のゴールは2つに限定されます：**(A) 無認証プレビューを閉じて本ログインで守る** ／ **(B) スキーマ(`schema.sql`)＋RLS(`rls.sql`)をDB側に用意して、後続のデータ移行の土台を作る**。

> つまり「今日繋いでも、まだ実顧客データを入れる段階ではない」。先に器（認証＋スキーマ＋RLS）を正しく作る回です。

---

## 1. あなたの手作業（STOP＝私が代行できない部分）

以下はアカウント権限・秘密情報を伴うため、Tomoさんの操作が必要です。

1. **Supabase プロジェクト作成** … <https://supabase.com> でプロジェクトを1つ作る（リージョンは Tokyo 推奨）。
2. **キーを2つ控える** … プロジェクトの Settings → API から
   - `Project URL`（= `NEXT_PUBLIC_SUPABASE_URL`）
   - `anon public` キー（= `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
3. **`.env.local` に2行追記**（既存の `OPENAI_API_KEY` はそのまま残す）：

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...（anon public キー）
   ```

4. **スキーマ適用** … Supabase の SQL Editor で、**この順に**実行：
   1. `supabase/schema.sql`（テーブル本体・トリガー・index）
   2. `supabase/rls.sql`（テナント階層＋RLS。冒頭コメントに「適用順: 1) schema.sql 2) このファイル」と明記）
5. **スタッフ許可リストを設定** … `.env.local` に管理画面へ入れるメールを登録（`NEXT_PUBLIC` を付けない＝サーバー専用）：

   ```
   STAFF_EMAIL_ALLOWLIST=ihara_tomonari@toho-massage.com
   ```

   空のままだと本番では管理画面アクセスを**拒否（fail-closed）**します。
6. **最初のログインユーザーを作成** … Supabase → Authentication → Users で、上の許可リストと同じメールのユーザーを1人作成（パスワード設定）。
7. （任意）**繋ぐ前に一旦ロックだけしたい場合** … `.env.local` に `NEXT_PUBLIC_LOCK_PREVIEW=1` を入れると、Supabase 未設定でもログイン必須にできます（暫定の鍵）。

> ⚠️ 「ChatWork トークン運用ルール」と同様に、`.env.local` は Git 管理外・クラウド同期フォルダ外で扱うこと。anon キーは公開可ですが、習慣として秘密情報と同じ場所で管理します。

---

## 2. 私（Cowork/Claude）側で代行できる準備（STOP外）

Tomoさんの上記作業の前後で、私が安全に巻き取れる部分：

- このランブックと `supabase-setup-guide.md` の整合・最新化（本コミットで対応）。
- `schema.sql` / `rls.sql` の**適用前ドライ確認**（テーブル依存順・外部キー順・命名衝突の机上レビュー）。
- 接続後の**疎通チェック観点**の整理（下記 §4）。
- 業務データ移行（localStorage → Supabase）の**段取り設計**（`supabase-migration-plan.md` の更新）。これは接続が済んでから着手。

「Supabase接続を準備（ドライ確認まで）」と言っていただければ、§4 の観点に沿って SQL の机上レビュー結果を出します。

---

## 3. デモモード解除条件（何が起きたら「本認証」に切り替わるか）

`app/dashboard/layout.tsx` の分岐に基づく事実：

| 状態 | `.env.local` | 挙動 |
|---|---|---|
| デモ（現在） | URL/ANONキー 無し・`LOCK_PREVIEW` 無し | 無認証で `/dashboard` 閲覧可（URLを知る誰でも入れる） |
| 暫定ロック | URL/ANONキー 無し・`LOCK_PREVIEW=1` | ログイン必須（ただし Supabase 未設定なのでログイン自体は不可＝事実上の閲覧封鎖） |
| **本認証** | **URL/ANONキー 有り** | `/login` 必須 → `signInWithPassword` → `STAFF_EMAIL_ALLOWLIST` 照合（fail-closed）→ 通過で `/dashboard` |

**解除（＝本認証化）の判定は「URL と anon キーが両方入っているか」だけ**（`isSupabaseConfigured()`）。コードのデプロイやフラグ切替は不要で、env を入れて再起動/再デプロイすれば自動で切り替わります。

---

## 4. 接続後の疎通チェック（順に確認）

1. `npm run dev` を再起動（env 反映のため）。
2. `/dashboard` へ直アクセス → **`/login` にリダイレクトされる**こと（＝本認証に切替成功）。
3. 許可リストのメール＋パスワードでログイン → `/dashboard` に入れること。
4. 許可リスト**外**のメールでログイン → **拒否される**こと（fail-closed の確認）。
5. Supabase の Table Editor で `schema.sql` のテーブル群（`stores`/`users`/`staff`/`services`/`rooms`/`shifts`/`customers`/`reservations`/`audit_logs` 等）が出来ていること。
6. `rls.sql` 適用後、`tenants`/`areas` 等のテナント階層テーブルが出来ていること。
7. この時点では**業務画面のデータは引き続き localStorage**（§0 のとおり）。ここで実顧客データを入れない。

---

## 5. この回の「やらないこと」（線引き）

- 業務データの Supabase 読み書きへの差し替え（別フェーズ）。
- 実顧客 CSV の本番投入（RLS レビュー＋運用条件確認が前提）。
- RLS の本番強度化（`rls.sql` は「設計段階」。NOT NULL 化やバックフィルは本番前に別途レビュー）。

---

## 関連ドキュメント

- `supabase-setup-guide.md` … スキーマ準備の概念編（前提理解）
- `db-tenancy-rls-design.md` … テナンシー＋RLS の設計全体像
- `supabase-migration-plan.md` … localStorage → DB のデータ移行計画（接続後フェーズ）
- `security-policy.md` / `security-implementation-plan.md` … 本番前のセキュリティ条件
