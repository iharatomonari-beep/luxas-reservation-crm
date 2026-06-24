# データモデル＋RLS 設計（外販マルチテナント対応）— 第1区切り

- 作成: 2026-06-23
- 位置づけ: 「本丸（サーバー側でデータを守る）」の**第1区切り＝設計**。SQLと本書のみで、稼働中アプリ（localStorage）は一切変更しない（非破壊）。
- 成果物: 本書 ＋ `supabase/rls.sql`（既存 `supabase/schema.sql` の後に適用するテナント分離＋RLS層）。

---

## 1. なぜ必要か（要点）

現状はデータが全てブラウザ(localStorage)にあり、店舗スコープも画面フィルタにすぎない。外販（複数の会社に提供）では「A社の顧客がB社に見える」ことが致命的（信用・個人情報保護法 APPI 違反）。
**根本解決＝データをサーバー(Supabase/PostgreSQL)に置き、DB自身に「自分の会社のデータしか触れない」門番(RLS)を焼き込む。**

---

## 2. テナンシー・モデル（どう区別するか）

```
tenant（契約会社：株式会社東邦）
  └ area（エリア：東京）
      └ store（店舗：LUXAS渋谷 …）
          └ 予約 / スタッフ / メニュー / シフト / 会計 …
customer（顧客）  ← テナント直下で会社内共有（home_store_id で初回店舗を保持）
user（ログインする人）→ user_roles（owner / manager / staff …）
```

### 採用した方針（要確認・後で変更可）
1. **テナント分離が「硬い壁」**: すべての業務テーブルに `tenant_id` を持たせ、RLSは「自分のテナントのデータだけ」を強制。会社をまたいだ閲覧・更新は**DBレベルで不可能**にする。
2. **店舗(store)は「柔らかい絞り」**: テナント内での絞り込み。店舗限定ロール（その店舗のスタッフ）はその店舗だけ、全店ロール（オーナー等）はテナント内の全店舗。
3. **顧客は会社内共有**（`customers.tenant_id` で分離、`home_store_id` は初回/所属店舗の参照のみ）【確定: 会社内共有】。整体チェーンで「どの店舗でも同じ顧客台帳」が一般的なため。**「店舗専属にしたい」場合は customers の RLS を store ベースに変えるだけ**（差し替え容易）。
4. **カルテ・注意事項は当面スタッフ全員が閲覧/編集可**【確定: 施術に必要なため全員可】。`is_sensitive` 列と機微列ビュー(`customers_basic`)は**将来制限をかける場合の土台として残す**（ポリシーに1行足すだけで owner/manager 限定に切替できる）。
5. **監査ログ(`audit_logs`)** は owner / manager のみ閲覧。重要操作（CSV出力・削除・会計）を記録。
6. **公開オンライン予約**は anon（未ログイン）から**生テーブルに触らせない**。空き照会・予約確定は **SECURITY DEFINER 関数(RPC)経由**にし、検証と最小権限を担保（他人の予約・顧客は読めない）。

---

## 3. 何が変わるか（DDLの追加点）

`supabase/rls.sql` で以下を追加（既存 schema.sql は不変、後段で適用）。

- **新テーブル**: `tenants`, `areas`。
- **列追加**: `stores.tenant_id / area_id`、各業務テーブルに `tenant_id`、`users.tenant_id`、`user_roles.scope_tenant_id`、`customers.home_store_id`。
- **索引**: `tenant_id` 系の複合インデックス。
- **ヘルパー関数**（RLSから呼ぶ・`security definer`・`stable`）:
  - `app_current_user_id()` … ログイン中(auth.uid())に対応する業務ユーザーID
  - `app_user_tenant_id()` … そのユーザーのテナント
  - `app_user_store_ids()` … 触ってよい店舗集合（全店ロール＝テナント内全店／店舗限定ロール＝その店舗）
  - `app_has_role(text[])` … いずれかのロールを持つか
- **RLS有効化＋ポリシー**: 全テーブルで `enable row level security`、テナント/店舗/ロールに基づく select/insert/update/delete ポリシー。
- **公開予約RPC**: `get_online_catalog()` / `get_open_slots()` / `create_online_booking()`（anon は EXECUTE のみ・生テーブル権限なし）。

---

## 4. RLSの考え方（例）

- 店舗を持つ業務テーブル（staff/services/shifts/reservations/会計…）:
  `using ( store_id in (select app_user_store_ids()) )`
  → これ1本で「自テナント＋触ってよい店舗」を同時に強制（`app_user_store_ids()` は自テナントの店舗しか返さないため、テナント分離も担保）。
- 顧客（会社共有）:
  `using ( tenant_id = app_user_tenant_id() )`
- カルテ等のノート（当面・全スタッフ可）:
  `using ( tenant_id = app_user_tenant_id() )`
  ※将来制限する場合は `and (is_sensitive = false or app_has_role(array['owner','manager']))` を足すだけ。
- 監査ログ:
  参照は `app_has_role(array['owner','manager'])` のみ。

---

## 5. 公開オンライン予約の安全設計

- anon（未ログインの予約者）には**テーブルの直接 SELECT/INSERT を一切付与しない**。
- 代わりに **3つの関数**を `security definer` で用意し、anon に EXECUTE のみ許可:
  - `get_online_catalog(store)` … 公開可能なメニュー等だけ返す（PIIなし）
  - `get_open_slots(store, date, service)` … 空き時刻だけ返す（他人の予約内容は返さない）
  - `create_online_booking(...)` … サーバー側で営業時間・空き・店舗整合を再検証してから予約＋ゲスト顧客を作成し、受付番号だけ返す
- これにより「未ログインでも予約はできるが、他人の個人情報は一切読めない／改ざんできない」を満たす（現状 localStorage 版の会員偽装・IDOR・濫用が原理的に塞がる）。

---

## 6. 移行ステップ（第2区切り以降の予定）

1. **第2区切り**: Supabaseプロジェクト作成→ `schema.sql` → `rls.sql` 適用→ 認証本実装（スタッフログイン＋RLS、公開はRPC）。env設定はユーザー作業（手順書を用意）。
2. **第3区切り**: アプリのデータ層を localStorage→Supabase へ**1領域ずつ**移行（顧客→予約→会計…）。各領域で動作確認。
3. 既存モックデータの投入は任意（本番は実データ）。`audit_logs` 記録、CSV出力の owner 限定、機微列ビューを順次有効化。

---

## 7. 確定事項（2026-06-23 ユーザー確認済み）

1. **顧客は会社内共有**（どの店舗でも同じ顧客台帳）。→ customers の RLS はテナント単位。
2. ロール体系は **owner（経営）/ manager（店長）/ staff（施術者）の3段**で確定。
3. **カルテ・注意事項は当面スタッフ全員が閲覧可**（施術に必要）。将来制限する可能性は残す（`is_sensitive` 列・`customers_basic` ビューを土台として保持）。

これらを `rls.sql` に反映済み。第2区切り（Supabase接続＋認証本実装）で適用・検証する。

---

## 8. Codex 第5回レビューを受けた設計修正（2026-06-24）

独立レビュー(Codex)で見つかった RLS設計の穴を修正:

1. **テナント越え防止（Critical）**: `app_user_store_ids()` の店舗限定ロールに `stores.tenant_id = users.tenant_id` 検証を追加。`user_roles` の WITH CHECK に「付与先ユーザー・scope_store_id・scope_tenant_id がすべて自テナント」を強制。→ 他テナント店舗UUIDを scope に混ぜる越境を遮断。
2. **ロール粒度の明確化（High）**: `for all` の一括ポリシーを **SELECT（店舗内スタッフ全員）/ 更新系（owner・manager）** に分割（staff/services/rooms/shifts）。予約・顧客は参照/作成/更新=スタッフ、削除=owner・manager。
3. **公開予約RPCの濫用対策（High）**: `create_online_booking` に staff/room の同一店舗検証・過去日時/営業時間外の拒否を追加。さらに **DBレベルの排他制約(EXCLUDE using gist)** で同一スタッフ/ブースの時間重複予約を物理的に拒否（並行リクエストでも安全）。※レート制限/CAPTCHA/冪等キーはアプリ/エッジ層で別途。
4. **デモ公開の露出低減（Medium）**: 全レスポンスに `X-Robots-Tag: noindex` ＋ `app/robots.ts` で全クロール禁止。※無認証デモ公開そのものの是非はユーザー判断（モックデータ前提で許容中。Vercelのデプロイ保護/パスワード or `NEXT_PUBLIC_LOCK_PREVIEW=1` でのロックを推奨）。
5. **残課題**: get_open_slots の availability 完全移植、nonce付き完全CSP、依存(Next/postcss)更新は第2区切り以降。
