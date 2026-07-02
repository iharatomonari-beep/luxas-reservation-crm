# Supabase バックアップ／復元 手順書（runbook）

対象: LUXAS 予約・顧客管理（本番 Supabase プロジェクト `bnkmhzxmdqssiufkhwbo`）
位置づけ: §5 チェックリスト **#6「バックアップと復元手順を確認済み」** を満たすための手順。
★**実顧客名簿（PM名簿）の投入は、本手順でバックアップ有効化＋復元テスト完了が前提**（#8 専門家確認も別途必須）。

> 注: バックアップ操作・プラン変更・復元は **オーナー（あなた）が実行**します。Claude は手順整備のみ。

---

## 0. 前提（プラン要件）

- **日次バックアップ**: Supabase Pro プラン以上で自動取得（無料プランは対象外）。
- **PITR（Point-in-Time Recovery / 任意時点復元）**: Pro + 有料アドオン。秒単位で任意時点へ復元できる。顧客個人情報を扱うため **PITR の有効化を推奨**。
- 現状プランを Dashboard → Organization → Billing で確認し、必要ならアップグレードする。

---

## 1. 自動バックアップ／PITR の有効化手順

1. Supabase Dashboard → 対象プロジェクト → **Database → Backups**。
2. **Scheduled backups（日次）** が有効か確認（Pro で自動）。取得時刻・保持期間（既定7日）を確認。
3. **Point-in-Time Recovery** タブ → **Enable PITR**（アドオン購入が必要）。
   - 保持期間（例: 7〜28日）を選択。長いほど安心だが費用増。**最低7日**を推奨。
4. 有効化後、`Backups` 画面に「PITR: Enabled・復元可能範囲（earliest〜latest）」が表示されることを確認。

### 補助（任意）: 論理バックアップ（pg_dump）
PITR とは別に、定期的な論理ダンプを手元にも持つと安心。
```bash
# 接続文字列は Dashboard → Project Settings → Database → Connection string（pooler 不可・direct を使用）
pg_dump "postgresql://postgres:<PASSWORD>@db.bnkmhzxmdqssiufkhwbo.supabase.co:5432/postgres" \
  --no-owner --no-privileges -Fc -f luxas_backup_$(date +%Y%m%d).dump
```
- ★ダンプファイルには個人情報が含まれる。**暗号化して本番DBと別の保管先**に置く（クラウド同期フォルダに平置きしない）。世代管理する。

---

## 2. 復元テスト手順（★本番投入前に必ず1回）

本番を壊さずに「復元が実際に効く」ことを確認する。**別プロジェクト or ブランチで実施**する。

### 方式A: PITR で復元（推奨）
1. Dashboard → Database → Backups → **Point-in-Time Recovery**。
2. 復元したい時刻（例: 数分前）を選択 → **Restore**。
   - ★本番プロジェクトに対する Restore は**上書き**になる。テストは新規プロジェクト復元か、本番では「直前時刻」を選ぶなど慎重に。可能なら **Supabase Branching** か別プロジェクトで試す。
3. 復元完了後、下記「3. 復元後の検証」を実施。

### 方式B: 論理ダンプから復元（別プロジェクトで検証）
1. 検証用の新規 Supabase プロジェクトを作成。
2. `pg_restore` で投入:
   ```bash
   pg_restore --no-owner --no-privileges -d "postgresql://postgres:<PASS>@db.<NEW_REF>.supabase.co:5432/postgres" luxas_backup_YYYYMMDD.dump
   ```
3. 下記「3. 復元後の検証」を実施。検証後は**テスト用プロジェクトを削除**（個人情報を残さない）。

---

## 3. 復元後の検証（チェック）

復元先で以下を確認する（架空データ段階では件数は小さくてよい）。

- [ ] 主要テーブルの件数が復元前と一致：`customers` / `reservations` / `audit_logs` / `staff` / `services` / `retail_items`。
  ```sql
  select 'customers' t, count(*) from public.customers
  union all select 'reservations', count(*) from public.reservations
  union all select 'audit_logs', count(*) from public.audit_logs;
  ```
- [ ] RLS が有効なまま（`select relrowsecurity from pg_class where relname='customers';` が `t`）。
- [ ] `tenant_id` の NOT NULL 制約が維持（`information_schema.columns` で `is_nullable='NO'`）。
- [ ] 二重予約 EXCLUDE 制約が存在（`reservations_no_overlap_staff` / `_room`）。
- [ ] アプリからログインでき、顧客一覧・予約台帳が表示される。
- [ ] 監査ログ RPC（`log_audit`）・公開RPC（`get_store_public_settings`）・owner出力RPC（`export_customers`）が存在する。

---

## 4. 運用チェックリスト（§5 #6 充足条件）

- [x] 日次バックアップが有効（Pro 以上）… **2026-07-02 Pro化・7世代表示を確認**
- [ ] PITR を有効化（保持期間 ≥ 7日）… 未加入（有料アドオン）。実顧客投入前に再検討
- [x] 復元手順（方式A/B）を読んで理解した
- [x] **復元テストを1回実施し、「3. 復元後の検証」を全て満たした** … **2026-07-02 「Restore to new project」で別プロジェクトへ復元→件数一致(staff59/services377等)・RLS true・EXCLUDE制約2・RPC3を確認→テスト用プロジェクト削除済み**
- [ ] （任意）論理ダンプを暗号化して別保管・世代管理
- [ ] 復元の所要時間・手順を関係者と共有

> 実施記録 2026-07-02: 復元は Dashboard の「Restore to new project」タブから実行（追加費用$0・所要約10分）。手順書作成時より簡単になっているため、次回以降もこの方式を第一候補とする。

> 上記がすべて ✅ になったら §5 #6 を満たす。**#8（個人情報の専門家確認）と合わせて、初めて実名簿の投入に進める。**

---

## 5. 障害時の初動（メモ）

- 「データが消えた/壊れた」と思ったら、まず**書き込みを止める**（該当機能を localStorage に戻す＝migration-config の1行で切替可能）。
- 共有DBの実件数を直接確認（画面の見え方に惑わされない）。
- 原因切り分け後、PITR で「壊れる直前の時刻」へ復元を検討。復元は上書きのため、判断はオーナーが行う。
