# データ移行 全体計画（マスタープラン）

最終更新: 2026-06-29（フェーズ4 §5の技術準備〔#1-5,#7〕完了。残るオーナー作業＝#6バックアップ・#8専門家確認 → その後 実名簿投入。組織は多店舗化時に正式移行〔案A〕） / 対象: LUXAS 予約・顧客管理 v0.1

このファイルは「いま各画面のデータが入っている“ブラウザ内の保存（localStorage）”を、ネット上の共有保管庫（Supabase）へ安全に引っ越す」ための**段取り設計**です。実装手順の細部は旧 `supabase-migration-plan.md`（中核10テーブル分）を引き継ぎつつ、その後に増えた機能ぶんを含めて**現状に合わせて作り直した版**です。

---

## 現在の進捗（2026-06-27 時点）

Supabase 接続（認証＝本稼働）は完了済み。データ移行は以下まで進行。

- ✅ **フェーズ0（下ごしらえ）** … 切替層（localStorage⇄Supabase をテーブル単位で切替）＋フィールドマッピング＋最小シード（tenant/area/store/users/user_roles）を導入。
- ✅ **フェーズ1（マスタ）** … staff / services / rooms / shifts を Supabase 化。実機で作成・編集・削除・再読込残存を確認。
- ✅ **フェーズ2（予約台帳）** … reservations を Supabase 化。実機で「作成→会計→再読込で残る」を確認。
- ✅ **フェーズ3 スライス1（決済マスタ）** … credit_card_companies / emoney_brands を新規テーブル作成＋RLS＋標準値seed＋DB化。会計モーダルの支払選択肢に反映（電子マネーの種類ドロップダウンも実装）。
- ✅ **フェーズ3 スライス2（会計アイテム＋レジ記録）** … checkout_items（標準プリセットseed）／register_records を新規テーブル＋RLS＋DB化。レジ各画面に「登録する」ボタン＋確定表示を追加。
- ✅ **フェーズ3 スライス3（物販）** … retail_categories / retail_items / retail_sales を新規テーブル＋RLS＋seed（カテゴリ6・商品62＝PM実データ）＋DB化。販売→商品は uuid FK＋legacy round-trip で参照解決。経営指標の物販集計に反映。
- ✅ **フェーズ3 スライス4（日次運用）** … expense_accounts（標準4科目seed）／expense_entries／attendance／daily_reports／daily_targets を新規テーブル＋RLS＋DB化。経費明細→科目・出退勤→スタッフは uuid FK＋legacy round-trip。日次目標は台帳/経営指標/トップKPIへ連動。DB側検証OK（画面の視覚確認は本番ビルドで一括予定）。
- ✅ **フェーズ3 スライス5（商品拡張）** … menu_categories（14）／service_options（236）／course_sets（2）を新規テーブル＋RLS＋seed＋DB化。3つとも参照なしの単純マスタ。services.category 文字列との並存は維持。
- ✅ **フェーズ3 スライス6（タグ3種）** … master_tags（1テーブル＋kind）を新規テーブル＋RLS＋seed（顧客2/予約ルート4/カルテ2）＋DB化。id=legacy_id 維持で予約の bookingTagIds 参照が壊れないことを実証。
- ✅ **フェーズ3 スライス7（メール3種）** … mail_templates／mail_deliveries／mail_auto_rules を新規テーブル＋RLS（テナント単位・write=owner/manager）＋seed（定型文2・自動ルール1）＋DB化。配信/ルール→定型文は uuid FK＋legacy round-trip。recipientIds は顧客legacy IDのjsonb保持（顧客はフェーズ4）。実送信なし。
- ✅ **フェーズ3 スライス8（シフトパターン/ひな型）** … shift_patterns／shift_templates を新規テーブル＋RLS＋seed（パターン3・ひな型2）＋DB化。テナント共通・時刻は text。ひな型は現状UI表示のみ（編集追加は別タスク）。
- ✅ **フェーズ3 スライス9（小マスタまとめ）** … online_blocks／turnaways／data_errors／user_directory を新規テーブル＋RLS＋seed＋DB化。user_directory は public.users（認証）と別の表示専用テーブルで認証非接触（実DBで public.users 無傷を確認）。EPARK・member-change は除外（後日）。
- ✅ **A スライス1（設定系・EPARK）** … epark_settings（テナント1行 JSONB単一行）＋RLS＋DB化。singleton用の新機構（loadTenantSettings/saveTenantSettings・settingsBackendFor・設定レジストリ）を実装（useLocalCollection 非使用・1行で local 切り戻し可）。
- ✅ **A スライス2（設定系・店舗設定 store-settings）** … store_settings（店舗1行JSONB）＋RLS＋公開RPC `get_store_public_settings`（ホワイトリスト19キーのみ／機微〔email/fax/notifyEmail/会員採番/invoice/managerName 等〕漏洩ゼロを実DBで実証）＋useStoreSettings backend対応（管理=全項目／公開anon=安全subset を session判定で自動分岐）。
- ✅ **多店舗対応（案B・B-min）完了（2026-06-29）** … 案A（org未移行）から多店舗運用へ移行。**org の読みは localStorage 据え置き（org mapper は使わない＝最小リスク）**のまま、(1) 他6店舗を `stores` に seed（★`stores.code`＝アプリ Store.id・渋谷行は不変）、(2) services を**テナント共通カタログRLS**に変更（共有メニューが全店で閲覧可・店舗別の出し分けは画面の storeIds）、(3) オーナーを**全店ロール**（user_roles.scope_store_id=null）に、(4) 他店スタッフ50名を正しい store_id で投入（計59名）。**★投入前後で渋谷の既存（staff9/services377/rooms10/retail3/register2/store uuid・code）が完全不変であることを実DB照合**。各店で「その店のスタッフ・メニューだけ」が出ることを実DB件数で確認（スタッフ：渋谷9/五反田東8/西5/錦糸町6/溝の口7/元町5/中目黒19、メニュー：渋谷84/中目黒74/溝の口102 等）。ブースは当初渋谷のみ10だったが、後続で**全7店舗に各10ブース（計70）を投入＋rooms を店舗スコープ化**（ServiceRoom.homeStoreId／store-room-scope の filterRoomsByStore／room-mapper profile往復／予約3画面の hasBoothCapacity を現在店舗で絞る）。渋谷は10で不変・各店ちょうど10を実DB確認。
  - 旧判断（案A・2026-06-27）：単一店舗pilotでは org 移行を見送っていた。多店舗運用の必要が出たため B-min で実施。org の完全DB化（B-full：tenants/areasにlegacy_id＋org mapper＋stores に sort_order/profile）は将来必要なら別スライス。
  - ★不変条件（厳守）：アプリ `Store.id`（例 "store-shibuya"）＝ DB `stores.code`。currentStoreId・各 records.storeId はこの値で、mapper は `ctx.storeIdByCode` で uuid 解決する。**これを uuid に変えると全テーブルの店舗解決が一斉に壊れる**（既存データがどの店舗にも出なくなる）。※紛らわしいが橋に使うのは Store.id であって アプリの Store.code("SHIBUYA") ではない。
  - ★現状の乖離（既知）：localStorage 7店舗 vs DB 1店舗（渋谷）＝実質シングル店舗（渋谷）でDB稼働。店舗切替に7店舗出るが渋谷以外は store_id 未解決。多店舗運用には案Bの正式移行が前提。
- 🔄 **フェーズ4（顧客）準備中** … §5チェックリストの技術側を完了：#1 顧客DB化（customers に legacy_id/profile jsonb 追加・架空2件のみ・実名簿未投入）／#2 監査ログ definer RPC `log_audit`（actor は auth 解決・PIIホワイトリスト7キー）／#3 CSVエクスポート owner限定（`export_customers` RPC・サーバー強制）／#4 二重予約 EXCLUDE 制約を実DBで有効確認／#5 RLS本番強度（tenant_id を40テーブルで NOT NULL化・null=0確認済）／#7 架空CSV取込を実DB実証。バックアップ手順書 `docs/ops/supabase-backup-restore.md` 作成。
  - ⬜ **残るオーナー作業（実名簿投入の前提）**：#6 Supabase の自動バックアップ/PITR 有効化＋復元テスト1回／#8 個人情報（個情法）の専門家レビュー。
  - ⬜ **その後 → B（実データ取込）の最終ステップ＝PM名簿の投入**。器・取込経路・重複防止・監査・PII保護は架空データで実証済み。**実名簿は #6・#8 完了まで投入しない**。

> 補足: 移行済み画面の「画面での視覚確認」は、開発サーバーだとブラウザ自動操作ツールが効かない（HMRで document_idle が立たない）。本番ビルド（npm run build → start）を一度立てれば Cowork がまとめて視覚確認できる。各スライスは DB 側で保存・参照解決・連動を検証済み。
- ⬜ **フェーズ4（顧客）** … 最後。個人情報のため §5 の条件を満たしてから。

### 今後の進め方（合意：A → B）

1. **A：残りの“データ種別”をDB化**（コレクション系は完了。残りは特殊3つ）
   - 設定系（store-settings／epark-settings）＝singleton設定 → 単一行テーブル＋専用フックの設計が必要。
   - 組織（tenants/areas/stores）＝既存テーブルへの読み書き接続（特殊）。
   - 顧客（フェーズ4）＝最後・§5条件を満たしてから。
2. **B：本物の既存データのDB取り込み（実データ移行）** ← Aの後
   - ⚠ 重要：これまでの移行は「器（テーブル）＋切替＋seed/ダミー」まで。**ユーザーの実データ（実スタッフ・実メニュー375件・過去予約・実顧客 等）はまだ localStorage にあり DB未投入**。本番運用前にDBへ取り込む必要がある。
   - 方式：localStorage 各キーの実データ → 対応テーブルへ（既存 mapper の toRow を流用）。ID・参照は legacy_id で突き合わせ。投入前にダミーで検証。
   - 顧客の実データ（PM名簿）は §4・§5 の条件下で最後に。パスワードは移行不可（各自が初回再設定）。

### 今回ハマった重要な教訓（次フェーズでも必ず効く）

1. **アプリで“任意”の列は、DBでも必ず NULL 許容にする。** reservations.room_id が NOT NULL だったため、部屋を固定しない通常予約（room_id=null）の INSERT が拒否され（Postgres 23502）、「予約が保存されず再読込で消える」現象が長く続いた。`alter table public.reservations alter column room_id drop not null;` で解決。→ フェーズ3で新テーブルを作る際は、アプリ側で空になり得る列を最初から nullable にする。
2. **“消えた”は削除とは限らない。** 今回はDB削除ではなく「INSERT拒否で最初から保存されていなかった」。切り分けは「共有DBの実件数」を直接見るのが確実（画面の見え方・ネットワーク監視・キャッシュに惑わされない）。
3. **キャッシュ対策。** dev のHMRに新コードが乗らないことがある。確実な検証はハードリロード（⌘⇧R）かシークレットウィンドウ。デバッグ時は画面に BUILD バッジを出して新コードか確認すると有効。
4. **localStorage 残骸の上書き。** 旧 localStorage の残骸が supabase モードで上書き／差分削除を起こす経路があった。supabase 管理テーブルはハイドレート時に localStorage を破棄する対策済み。

### 次回セッションの再開手順（引き継ぎ）

新しいセッション（Cowork / Claude Code）で続きを始めるときは、次の順で**状態を確認してから**進める。

1. このファイルの「現在の進捗」を読む（どのスライスまで完了か）。
2. `docs/sessions/` の最新ログを読む（当日の詳細）。
3. `features/master-data/migration-config.ts` を見て、どの localStorage キーが `"supabase"` に設定済みか＝**実際にDB化済みのテーブル**を確認する（ここが「真の状態」）。
4. `npx tsc --noEmit` / `npm run lint` が green か確認。
5. 上記をユーザーに要約してから、フェーズ3の続き（メール／シフトパターン・ひな型／オンライン設定・返客・データ不備）か、顧客（フェーズ4・§5条件の整備）に進む。
6. 移行済み画面の「視覚確認」は未実施。必要なら本番ビルド（`npm run build` → `npm start`）を立てて確認する（dev は HMR で自動操作不可）。

**実装パターン（確立済み）**: 新テーブルは専用SQLファイル（DDL+RLS+seed）→ ユーザーが Supabase の SQL Editor で Run → mapper 実装（参照なし＝fee-master同型／参照あり＝ctx に legacy→uuid マップ追加＋round-trip列）→ migration-config で `"supabase"` 化 → Claude Code が共有DBで客観検証。**★教訓：アプリで空になり得る列は必ずDBで NULL 許容にする**（room_id 事件の再発防止）。

---

## 0. いちばん大事な発見（先に読む）

調査の結果、現在アプリが保存しているデータは **約34種類**（UI状態を除く）。一方で、Supabase に用意済みの「器（テーブル）」は **15個だけ**です。つまりデータは大きく3グループに分かれます。

- **グループA：器がもう有る → すぐ引っ越せる**
  スタッフ／メニュー／ブース／シフト／予約／顧客／組織（テナント・エリア・店舗）／監査ログ／取込履歴。
- **グループB：器がまだ無い → 先に器（テーブル）を作る設計が必要**
  会計明細・物販（商品/カテゴリ/販売）・日次管理（出退勤/レジ金/日報/目標）・経費（科目/明細）・メール（定型文/配信/ルール）・タグ・メニューカテゴリ・オプション・セット商品・決済マスタ（クレカ/電子マネー）・シフトパターン/ひな型・オンライン予約設定・返客・データ不備・EPARK設定 など **約20種類**。
- **グループC：引っ越し不要（端末ごとのメモでよい）**
  「今表示している店舗」「台帳で選んでいる日付」など画面の一時状態。これはSupabaseに入れない。

> つまり今回の作業は「**引っ越し**」だけでなく、**引っ越し先の部屋を増やす（テーブル追加）**作業がセットになる、というのが最大のポイントです。ここを見落とすと「会計や物販のデータが移せない」で止まります。

---

## 1. ゴールと全体方針

**ゴール**: 予約・顧客をはじめとする業務データが Supabase に保存され、**複数の端末・スタッフで同じデータを共有**でき、**消えない（バックアップが効く）**状態にする。

**方針（旧計画から継続）**:
1. リスクの低い**マスタ系から**始める。
2. 次に**予約台帳**の中核。
3. **顧客は最後**（個人情報・権限・監査・CSVの影響範囲が最大のため）。
4. 各機能は **localStorage を当面残し**、DB接続が安定したものから順に外す（トラブル時に戻せる）。
5. **本物の顧客データ（PM名簿）は全工程の最後**。ダミーで通してから。

---

## 2. 引っ越しの順番（フェーズ設計）

各フェーズは「**器が有るか**」「**他データへの依存**」「**個人情報リスク**」で並べています。前のフェーズが安定（完了条件クリア）してから次へ。

### フェーズ0：移行の下ごしらえ（コードの土台）★最初に必須
- localStorage の読み書きを集約している層（`features/master-data/local-storage.ts` 等）に、**「Supabaseを読む／localStorageを読む」を切り替えられる入口**を用意する。画面は触らず、データの出入り口だけ差し替えられるようにする。
- **ID・型の不一致を吸収する変換**を1か所に用意（§3参照）。
- ダミーデータでの接続確認だけ先に通す。
- 完了条件: 1テーブル（例 staff）だけ Supabase 経由で一覧表示できる。lint/build OK。

### フェーズ1：マスタ系（器あり）
- 対象: **staff → services → rooms → shifts**（この順）。
- 予約台帳が参照する基礎。ここが安定すると後が楽。
- 完了条件: 各マスタの一覧/作成/編集/削除が Supabase で動く。台帳の担当・メニュー・ブース選択がDB参照になる。

### フェーズ2：予約台帳の中核（器あり）
- 対象: **reservations → reservation_resources**。
- 予約の一覧/作成/編集/キャンセルをDB化。`customer_name`/`phone` は当面そのまま保持し、`customer_id` 連携は顧客DB化後。
- 予約可否（重複・シフト外）チェックは画面だけでなく**サーバー側でも**効くように。
- 完了条件: ダミー予約でCRUD・重複チェックがDB経由で動く。

### フェーズ3：器が無いデータ群の「器づくり＋移行」（グループB）★設計が要る
ここが今回いちばんボリュームがある所。**いきなり全部やらず、業務の近さでまとめて小分け**に進める。推奨の小分け順:
1. **会計・決済まわり**: 会計明細（checkout-items）／レジ記録（register-records）／決済マスタ（creditcards・emoney）。売上集計の根拠になるため早め。
2. **物販**: 商品・物販カテゴリ・物販販売。
3. **日次管理**: 出退勤・レジ金点検・売上日報・日次目標。
4. **商品マスタ拡張**: メニューカテゴリ・オプション・セット商品。
5. **タグ**: 顧客タグ・予約ルートタグ・カルテタグ。
6. **経費**: 科目・明細。
7. **メール**: 定型文・配信履歴・自動ルール（実送信は将来）。
8. **その他**: オンライン予約設定・返客・データ不備・EPARK・シフトパターン/ひな型。
- 各サブステップの完了条件: 新テーブルのDDLを `schema.sql`（または追補SQL）に追加 → RLSを `rls.sql` に追加 → 当該画面をDB接続 → ダミーで動作確認。
- ⚠ 各テーブル追加時に**店舗スコープ（store_id）とテナント（tenant_id）列**を最初から入れる（後付けは手間）。既存の店舗scope設計（`multi-store-scope-design.md` 等）に合わせる。

### フェーズ4：顧客（器あり・最後）★個人情報
- 対象: **customers → customer_notes**。
- 一覧/検索/詳細/編集をDB化。注意事項・カルテは `customer_notes` に。
- 顧客詳細閲覧・編集・CSV入出力を**監査ログ（audit_logs）対象**に。CSV書き出しは owner 権限のみ。
- 完了条件: §5 の「本物CSV投入前の条件」を全て満たす。

### フェーズ5：仕上げ
- 監査ログ（audit_logs）・取込履歴（import_jobs）を実運用に接続。
- 安定した機能から localStorage を外す。
- バックアップ／復元手順の確認。

---

## 3. 型・IDの不一致（吸収が必要な点）

localStorage版とSQL版で形が違う箇所があり、**変換を1か所に集約**して吸収します（フェーズ0で用意）。

- **ID**: localStorageは文字列ID（`"staff-001"` 等）、SQLは `uuid`。→ 移行時にマッピング表を作るか、`uuid` を新採番して旧IDを `legacy_id` 列に保持。
- **配列カラム**: 例 `serviceMenuIds: string[]`（JS）↔ `service_menu_ids uuid[]`（SQL）。中身のIDも上記マッピングが必要。
- **店舗スコープ**: 既存データは `storeId` 未設定のものが「既定店舗（渋谷）扱い」。移行時に既定店舗IDを明示的に埋める。
- **日付/時刻**: 文字列（`"2026-06-26"`/`"10:00"`）↔ SQLの `date`/`time`/`timestamptz`。タイムゾーンは JST 前提で統一。
- **真偽・数値**: 文字列で持っている項目（例 顧客の `totalVisits?: string`）はDB側で数値/真偽に正規化。

> この「対応表（フィールドマッピング）」を**テーブルごとに1枚**作るのがフェーズ0の主作業。ここが移行スクリプトの心臓になります。

---

## 4. 本物の顧客データ（PeakManager名簿）の取り込み

- 位置づけ: **全工程の最後**（フェーズ4の中）。それまではダミーで通す。
- 経路: 既存のCSV入出力画面（`import-export-manager`）の顧客取込を、Supabase書き込みに接続して使う。取込のたびに `import_jobs` に履歴を残す。
- **パスワードは移行不可**（どのシステムも暗号化保存で平文を出せない）。お客さんログインを本物にする場合は「名簿を取込→各自が初回パスワード設定」が標準ルート（※顧客認証の本実装は別テーマ）。
- 投入前に §5 の条件を必ず満たすこと。

---

## 5. 本物の顧客データを入れる前の必須条件（チェックリスト）

- [x] 顧客（customers）が Supabase で動く ← **S1完了（2026-06-29・ダミー2件のみ／実名簿未投入）**。profile(jsonb)退避方式・参照=テナント全員。customer_notes は当面未使用（caution/chart_memo は顧客レコード保持）。
- [x] 監査ログが「顧客閲覧・編集・CSV入・CSV出」を記録する ← **S2完了（2026-06-29）**。definer RPC `log_audit`（actor/role/tenant/store を auth から解決＝偽装不可・書込はdefiner経由のみ）。detail は**ホワイトリスト7キー**で氏名/電話/カルテ本文を構造的に排除（実DBで pii_leak=[] 実証）。顧客の view/update/import/export の4箇所で記録。
- [x] CSV書き出しが owner 権限のみに制限されている ← **S3完了（2026-06-29）**。顧客出力は owner限定の definer RPC `export_customers()` 経由（★non-owner はサーバーで raise＝UI迂回不可）。UIは `app_is_owner()` でボタン制御。出力成功時に RPC が log_audit('export', {count,fields列名}) を内部記録。実DBで owner可/非owner拒否/監査記録を実証。
- [x] 予約可否判定がサーバー側でも動く ← **S4で確定（2026-06-29）**。二重予約は実DBの EXCLUDE 制約（`reservations_no_overlap_staff`/`_room`・btree_gist）が物理拒否することを実機実証（重複INSERTが `23P01` で拒否）。※メニュー提供時間/シフト内/ブース空きのリッチ判定はクライアント側のまま（pilot許容）。
- [x] RLS（アクセス制限）が本番強度で実装済み ← **S4完了（2026-06-29）**。実DBで tenant_id は全テーブル null=0 を確認 → `tenant_id` を 40テーブルで **NOT NULL 化**（1トランザクション）。バックフィルは不要だった。顧客RLSは `tenant_id=app_user_tenant_id()`（テナント全員・決定どおり）で意図どおり動作を再点検。★テナント共通マスタの store_id は設計どおり全行 null＝nullable維持（NOT NULL化せず）。
- [ ] バックアップと復元手順を確認済み ← **手順書を整備（2026-06-29・`docs/ops/supabase-backup-restore.md`）**。PITR有効化＋復元テストの実施は★オーナー作業（実名簿投入の前提）。実施完了でチェック。
- [x] ダミーCSVで取込確認済み ← **S5完了（2026-06-29）**。sample-csv の架空CSV（標準2件＋PM形式1件）を取込処理のデータ変換どおりにSupabaseへ投入し実DB検証：件数3・往復一致（profile退避含む）・dedup（同一legacy_idは23505で拒否）・import監査記録（{count,format}・PIIなし）。テスト投入分は掃除済み（残0）。
- [ ] 個人情報保護法上の判断を専門家に確認済み

---

## 6. localStorage との併存と切り戻し

- DB接続は**機能単位で順次**。切り替え前の機能は localStorage のまま動かす。
- フェーズ0で用意する「切り替え入口」により、問題が出たら**その機能だけ localStorage に即戻せる**ようにしておく。
- 最終的に本番では localStorage を業務データに使わない（UI状態＝グループCのみ残す）。

---

## 7. リスクと、オーナーに判断してほしい点

進める前／途中で、以下は**あなたの判断**が要ります（Claude Code は勝手に決めず止めます）。

1. **どこまで今回やるか**: 「マスタ＋予約だけ先に共有（フェーズ0〜2）」で一旦運用するか、「会計・物販・日次まで（フェーズ3）」も一気にやるか。**おすすめは前者（0〜2）を先に本稼働**させ、価値を確認してからフェーズ3へ。
2. **店舗スコープの厳密化**: 既存の“未設定＝渋谷扱い”を、移行時にどこまで厳密に店舗IDで埋めるか。
3. **顧客CSV投入の時期**: ダミー運用をどれくらい回してから本名簿を入れるか。
4. **個人情報の専門家確認**: 本番投入前のレビューを誰に依頼するか。

---

## 8. 最初の一歩（この計画でGoが出たら）

1. フェーズ0（切り替え入口＋フィールドマッピング1枚＝staff）をClaude Codeに小さく作らせる。
2. staff だけ Supabase 表示までを通して、感触と所要時間を測る。
3. 問題なければ services→rooms→shifts→reservations と横展開。

---

## 関連ドキュメント
- `supabase-migration-plan.md` … 中核10テーブルの実装手順（個別詳細）
- `supabase-connection-runbook.md` … 接続そのものの手順（済）
- `db-tenancy-rls-design.md` … テナンシー＋RLS設計
- `multi-store-scope-design.md` … 店舗スコープ設計
- `security-policy.md` / `security-implementation-plan.md` … 本番前セキュリティ条件

---

## 組織（tenants / areas / stores）の扱い ＝ 当面DB移行しない（2026-06-28 決定・案A）

フェーズ3〜A の全コレクション＋設定をDB化したが、**組織（org）だけは当面 localStorage 据え置き**とする。理由・不変条件・将来移行（案B）を以下に確定記録する。

### 決定
- **案A 採用：組織を移行しない**。アプリは org（tenants/areas/stores）を localStorage（initialStores 等）から読み、店舗切替セレクタ・/dashboard/org 表示に使う。
- DBの org（tenants/areas/stores テーブル＋最小シード）は**既に store_id 解決の正本**として機能しており、これで十分。
- シングル店舗pilotでは移行の追加価値が小さく、失敗時のリスク（全テーブルの店舗解決崩壊）が上回るため。

### ★不変条件（恒久・絶対に壊してはいけない）
**「アプリの `Store.id` ＝ DB `stores.code`」**。
- 全テーブルの records は `storeId` にアプリの `Store.id`（例 `"store-shibuya"`）を保存し、各 mapper が `ctx.storeIdByCode[storeId]`（DB `stores.code` で構築）で `store_id`(uuid) を解決する。
- 最小シードで DB `stores.code='store-shibuya'`（＝アプリ Store.id 値）に設定済み。
- ⚠️ 紛らわしい点：アプリ Store には別途 `code:"SHIBUYA"`（大文字）があるが、**橋に使うのは Store.id（`store-shibuya`）＝ DB stores.code** であって、アプリ `Store.code("SHIBUYA")` ではない。
- この対応がズレると、currentStoreId / records.storeId / store解決が一斉に壊れる。新しい店舗をDBに足すときは **stores.code に「アプリ側の Store.id 値」** を入れること。

### ★現状の乖離（既知・許容中）
- localStorage の org は **store 7件**（渋谷/五反田東西/錦糸町/溝の口/元町/中目黒）。
- DB の org は **store 1件（渋谷）のみ**（最小シード）。
- → 店舗切替セレクタは7店舗出るが、**渋谷以外はDB未登録で `ctx.storeIdByCode` に無く解決できない**。渋谷以外で店舗別データを作成すると `store_id=null`（店舗別テーブルはNOT NULLで拒否）。＝**実質シングル店舗（渋谷のみDB稼働）**。
- 当面 pilot は渋谷のみで運用するため許容。

### 将来の正式移行（案B・多店舗を実運用する段で実施）
1. DDL：tenants/areas に `legacy_id text` を追加（stores は既存 `code` を橋に流用）。空になり得る列はNULL許容。
2. seed：localStorage の **全7店舗 ＋ area/tenant を DB 投入**。各 `stores.code` = アプリ `Store.id`（`store-shibuya` 等）、areas/tenants の `legacy_id` = アプリ id（`area-tokyo`/`tenant-toho`）。area_id/tenant_id も解決して張る。
3. mapper（org 3種）：store は fromRow `id = DB stores.code`（アプリ id 維持）／area/tenant は `id = legacy_id`。store.areaId/tenantId は legacy へ逆引き。→ currentStoreId / records.storeId は不変。
4. use-current-store を DB読みに切替（既定 currentStoreId は従来どおり `store-shibuya`）。
5. ★整合検証：切替後も既存の予約/売上/レジ/日次/物販が「渋谷」で従来どおり表示され、別店舗データが他店舗に漏れないことを必須確認。
6. RLS は既存 rls.sql の tenants/areas/stores ポリシーを流用（新規不要）。
