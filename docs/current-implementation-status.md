# LUXAS 予約・顧客管理システム — 実装状況まとめ（現状確定版）

作成日: 2026-06-13
調査方法: リポジトリ `luxas-reservation-crm` のソースコード・SQL・`docs/` を直接読み込んで確認（コード読解ベース。実機 `npm run dev` での動作確認ではない。特にドラッグ移動の実挙動は実機操作での最終確認が別途必要）。
原則: 推測で断定しない。確認できたファイル名とコード上の根拠を示し、確認できないものは「確認できません」と明記する。

---

## 1. 現状まとめ

- スタック: **Next.js 15 + React 19 + TypeScript + Tailwind + Supabase(@supabase/ssr)**（`package.json`）。
- README によれば **Day 1〜7 まで完了**。ログイン／管理画面／予約台帳／顧客管理／CSV入出力までを **localStorage ベースで動作確認済み**。
- **実データは全て localStorage。Supabase は未接続。** `.env.local` には `OPENAI_API_KEY` のみで Supabase URL/anonキーが無く、`isSupabaseConfigured()`（`lib/supabase/config.ts`）が false を返すため、アプリは常時「プレビューモード」（認証なし・localStorage）で動作する。
- 一方、**Supabase の DDL（`supabase/schema.sql` 全13テーブル）と移行計画・DB設計・セキュリティ方針のドキュメントは整備済み**。「設計は厚いが接続は未着手」という状態。
- 段階のまとめ: **業務プロトタイプ（localStorage版）はほぼ完成。Supabase本接続・経営/会計/日次系は未着手。**

---

## 2. 作成済みファイル

### アプリ本体（役割 / 完成度 / 注意点）

| ファイル | 役割 | 完成度 | 注意点 |
|---|---|---|---|
| `app/dashboard/reservations/page.tsx` + `features/reservations/reservation-ledger.tsx`（2,309行） | 予約台帳 | 高 | `businessStart`/`businessEnd` が `"10:00"`/`"23:00"` のハードコード（L46-47、店舗設定マスタ未連動） |
| `features/reservations/reservation-create-page.tsx`（889行） | 予約作成 | 基本機能は完成 | PM相当のオプション/割引/インターバル等なし |
| `features/customers/customer-manager.tsx`（1,067行） | 顧客管理 | 高（検索・詳細・カルテメモ・PM明細表示） | フル検索の高度条件は未 |
| `features/import-export/import-export-manager.tsx`（1,570行） | CSV入出力 | 高（顧客/スタッフ/メニュー/予約＋PM顧客明細） | — |
| `features/master-data/{staff,service,room,shift}-manager.tsx`（226〜346行） | 各マスタ管理 | 中〜高 | シフトは日付単位フォーム式（月間カレンダーではない） |
| `features/*/types.ts` ・ `features/*/mock-data.ts` | 型定義・モックデータ | — | モック `shifts` は **06-13（本日）を含む**（`mock-data.ts`）。05-30の「今日が空表示」課題は解消の可能性 |
| `lib/supabase/{browser,server,config}.ts` | Supabaseクライアント | クライアント実装済み | 呼び出しは**認証のみ。業務データ未使用** |
| `app/dashboard/[section]/page.tsx` | `/grid`・`/settings` のプレースホルダ | 準備中表示のみ | 「Day Xで実装予定」表示 |

### ドキュメント（`docs/`、計17本）

- 整理済み: `prototype-scope.md` / `day-by-day-plan.md` / `screen-list.md` / `luxas-reservation-ledger-spec.md`（台帳仕様の正本）/ `luxas-master-data-redesign.md`（マスタ再設計）/ `db-schema.md`・`supabase-db-design.md`・`supabase-migration-plan.md` / `peakmanager-ui-structure-analysis.md`・`peakmanager-export-gap-analysis.md`・`peakmanager-next-export-checklist.md` / `manual-check-notes.md`・`test-checklist.md` / `security-policy.md`・`security-implementation-plan.md`・`supabase-setup-guide.md`・`deployment-checklist.md`。
- 注意点: **DB設計が二系統**ある。`db-schema.md`（旧: `service_menus`/`staff_shifts`/`karte_entries`）と `supabase-db-design.md` ＝ `supabase/schema.sql`（新: `services`/`rooms`/`shifts`/`customer_notes`/`users`/`audit_logs` 他）。実装SQLは**新系統**。

---

## 3. 実装済み機能（対象ファイル / できること / まだ危ない点）

- **認証・ルート保護** — `app/dashboard/layout.tsx`・`components/auth/login-form.tsx`。Supabase設定時のみ `signInWithPassword`＋`/login`リダイレクト。**危険点=キー未設定のため常時プレビューで誰でも入れる**。
- **予約台帳タイムライン** — `reservation-ledger.tsx`。5分刻み（`slotMinutes=5`）の横軸時間×縦軸スタッフ。当日シフト中スタッフのみ表示。
- **予約カードのドラッグ移動** — 同左。横=時刻変更（5分スナップ）／縦=スタッフ変更／保留棚で別日移動。**`[drag:move]`/`[drag:drop]` 診断ログが残ったまま**（本番前に要削除）。
- **移動・作成時の検証** — `validateDraggedReservation`／`validateReservationForm`。シフト外・休憩重複・5分単位・同一スタッフ/同一ブース重複・停止中ブース・スタッフ対応メニューをチェックし**ブロック**。
- **予約作成→台帳反映** — `reservation-create-page.tsx`（`postMessage`＋localStorage通知）／ledger側リスナー（message/storage/focus）。
- **顧客管理** — `customer-manager.tsx`。検索・新規・詳細・カルテメモ・PM明細表示。
- **CSV入出力** — `import-export-manager.tsx`。4種＋PM顧客明細の取込/書出、必須チェック・件数表示。
- **各マスタCRUD** — `master-data/*-manager.tsx`。
- **危険点（共通）** — 全データ localStorage・本番認証/RLS無し・台帳の営業時間ハードコード。

---

## 4. 未実装機能（理由 / 関連画面 / 関連データ）

- **Supabase本接続・データ永続化** — 複数端末運用に必須。関連=全画面。関連データ=`schema.sql` の全13テーブル。
- **経営指標ダッシュボード・売上集計** — トップ（`app/dashboard/page.tsx`）は導線ハブのみで売上グラフ無し。関連データ=売上系（**確認できません＝該当テーブル/型なし**）。
- **日次管理（出勤退勤・開店/閉店・レジ金点検・売上日報・月間目標・経費登録）** — **画面・型・テーブルとも確認できません**。
- **会計・レジ・物販** — 確認できません。
- **予約集計バー／予約一覧テーブル／当日情報3タブ** — 台帳は「予約中N」バッジと「選択中の予約」パネルのみ。
- **メニュー別利用可能ブース（course_booth_assignments相当）** — `buildSelectableRooms`（`reservation-ledger.tsx` L1426〜）は**サービスで絞らず全ブース表示**。未実装。
- **オプション・割引・インターバル・性別・こだわり・予約タグ・指名・連続予約** — `reservation-create-page.tsx` は5セクション（顧客/メニュー/担当・ブース/日時/メモ）のみ。
- **時間グリッド（`/grid`）・店舗設定（`/settings`）** — プレースホルダ。
- **メール管理・経費マスタ・クレカ/電子マネー/TORICOM** — 確認できません。

---

## 5. 仕様整理済みだが未実装（docs上のファイル / 実装時の注意点）

- **Supabase移行** — `supabase-db-design.md`・`supabase-migration-plan.md`・`supabase/schema.sql`。移行順は staff→services→rooms→shifts→reservations→…→customers（顧客は最後）。localStorageの型とSQLカラムは**不一致**（例: localStorageは `serviceMenuIds: string[]`、SQLは `service_menu_ids uuid[]`、IDが string vs uuid）。移行スクリプトで吸収が必要。
- **店舗設定・営業時間・予約受付時間・時間表示単位** — `luxas-master-data-redesign.md`（§2-5）。台帳の `businessStart/End` ハードコードをこのマスタ参照へ置換する設計が前提。
- **シフトパターン／メニュー別ブース／スタッフ別対応メニュー** — `luxas-master-data-redesign.md`（§9,12,13）。スタッフ別対応メニューは**コードに `serviceMenuIds` として既に部分実装**、残りは中間テーブル化が論点。
- **ドラッグ移動の正式仕様** — `luxas-reservation-ledger-spec.md` §13。仕様書は「同一スタッフ行内のみ・実装は後」だが、**実コードは縦移動でスタッフ変更まで実装済み**。仕様書とコードに乖離があり、どちらを正とするか要確認。
- **監査ログ・CSVインポート履歴・RLS・権限** — `supabase-db-design.md`・`security-implementation-plan.md`・`security-policy.md`。本番顧客データ投入前の必須条件として明文化済み。
- **顧客タグ・予約ルートタグ・施術カルテタグ** — `luxas-master-data-redesign.md`（§14-16）。コードの `Customer.tags: string[]` は単純配列で、タグマスタは未実装。

---

## 6. 仕様不足・追加確認が必要な画面（不足画面 / 不足項目 / 追加スクショ確認）

### 仕様自体が docs に見当たらず確認できない画面（PMメニュー基準）

- **日次管理の全サブ画面**（出勤・退勤／開店処理／レジ金点検／閉店処理／閉店処理検索／売上日報作成／月間目標入力／経費登録）— 仕様書なし。**PMの該当画面スクショの確認が必要**。
- **店舗情報の詳細**（クレジットカード会社情報／電子マネー情報／**TORICOM設定**／ユーザ情報の管理画面）— 仕様断片はあるが画面仕様なし。
- **経営指標の各帳票**（売上・明細集計／スタッフ別／商品別／時間帯別来店分析 等）— `peakmanager-ui-structure-analysis.md` で「構造把握のみ・実装後回し」。
- **商品情報のオプション／物販** — 仕様薄い。
- **メール管理** — `prototype-scope.md` で v0.1 対象外と明記。

### 不足項目（既存画面内）

- 予約作成のPM相当項目（性別・オプション・割引・インターバル・こだわり・予約タグ・指名・連続予約）。
- 予約台帳ツールバー（表示切替・カテゴリ絞り込み・インターバルON/OFF・ひな型登録/読込）— コード上見当たらず。
- 顧客「フル検索」の高度条件（誕生月・年齢・顧客ランク・最終来店からの日数・DM希望 等）— 型には項目があるが検索UIは氏名/カナ/電話/メール/タグのみ（`customer-manager.tsx`）。

---

## 7. 予約台帳の問題点（コード根拠つき）

対象: `features/reservations/reservation-ledger.tsx`・`reservation-create-page.tsx`

- **5分単位**: 実装済み（`slotMinutes=5`・`slotWidth=16`、L48-49）。
- **予約カード表示ロジック**: `visibleStart=max(start, timelineStart)` / `visibleEnd=min(end, timelineEnd)` で算出（L1503-1517）。仕様書 §6 と一致。
- **保存後の台帳反映**: 実装済み。作成側が localStorage 更新＋`postMessage("reservation-created")`（L153-194）、台帳側が message/storage/focus で再読込（L389〜）。
- **date/startTime/staffId 受け渡し**: URLクエリ→`new/page.tsx`→`initialPrefill`→`createInitialForm`（`reservation-create-page.tsx` L450〜）。仕様書 §7 と一致。
- **「予約が10時にずれる可能性」**: 根拠あり。`businessStart="10:00"` ハードコード（L46）に加え、`openCreateForm` が `prefill.startTime ?? "10:00"`（L610）、`createInitialForm` が `prefill.startTime || "10:00"`（create-page L455）。**startTimeが空/未渡しのとき必ず10:00に落ちる**設計のため、ここがズレの発生点。
- **シフト外スタッフの非表示**: 実装済み（`getVisibleStaffForSelectedDate`、L204-224。`workDate===選択日 && isActive && start/end あり`で絞る）。
- **ドラッグ移動**: 実装済み（横=時刻/縦=スタッフ/保留棚=別日、診断ログ入り）。※実機での最終動作確認が必要。
- **移動先に既存予約がある場合の移動不可**: 実装済み。`validateDraggedReservation`（L1546〜）で `同一staffId または 同一roomId` かつ時間重複なら**エラーを返して移動を確定しない**（L1614-1626）。
- **ブースとコースの紐付け**: **未実装**。`buildSelectableRooms`（L1426）はサービスで絞らず全ブースを返す。一方**スタッフとコースの紐付けは実装済み**（`getSelectableStaffForService`＋`StaffMember.serviceMenuIds`）。

---

## 8. データ構造の不足

要求された23項目について、コード（`features/*/types.ts`・`mock-data.ts`）／SQL（`supabase/schema.sql`）／docs のどこに存在するか。

| 要求テーブル | コード(型/モック) | SQL DDL | docs | 判定 |
|---|---|---|---|---|
| stores | ✕（時間はハードコード） | ✓ L23 | ✓ | SQL/docsのみ |
| staff | ✓ StaffMember | ✓ L56 | ✓ | あり |
| booths | ✓ ServiceRoom(rooms) | ✓ rooms L85 | ✓ | あり |
| customers | ✓ Customer | ✓ L116 | ✓ | あり |
| reservations | ✓ Reservation | ✓ L156 | ✓ | あり |
| courses | ✓ ServiceMenu(メニュー) | ✓ services L71 | ✓ | あり（名称=メニュー） |
| course_categories | △ `category` テキスト項目のみ | △ 同左 | △ | 独立テーブルなし |
| course_staff_assignments | △ `serviceMenuIds`配列 | △ `service_menu_ids uuid[]` | ✓ staff_menu_relations(再設計) | 中間テーブルは未 |
| course_booth_assignments | ✕ | ✕ | ✓ menu_room_relations(再設計) | docs案のみ |
| options | ✕ | ✕ | ✕ | 確認できません |
| shift_patterns | ✕ | ✕ | ✓ master-data-redesign §9 | docs案のみ |
| shift_templates | ✕ | ✕ | △ patternsはあるがtemplatesは無 | 確認できません |
| monthly_shifts | △ StaffShift(日付単位) | △ shifts(日付単位) | ✓ | 月間集約は無し |
| daily_attendance | ✕ | ✕ | ✕ | 確認できません |
| cash_register_checks | ✕ | ✕ | ✕ | 確認できません |
| daily_reports | ✕ | ✕ | ✕ | 確認できません |
| expense_accounts | ✕ | ✕ | ✕ | 確認できません |
| expenses | ✕ | ✕ | ✕ | 確認できません |
| credit_card_companies | ✕ | ✕ | ✕ | 確認できません |
| electronic_money_brands | ✕ | ✕ | ✕ | 確認できません |
| toricom_settings | ✕ | ✕ | ✕ | 確認できません |
| users | ✕（preview固定） | ✓ users/user_roles L36,48 | ✓ | SQL/docsのみ |

補助的にSQLに存在: `customer_notes`・`reservation_resources`・`import_jobs`・`audit_logs`（いずれもコード未使用）。

不足が大きいのは**会計・日次・経費・決済マスタ・物販・オプション系**で、これらは型・SQL・仕様のいずれにも見当たらない。

---

## 9. 次にやるべき順番

### P0（先にやらないと他が壊れる）

1. **ドラッグ移動の実機動作確認**（`npm run dev`）— コードは実装済み・診断ログ入り。動けば「不具合中」を解除。Cowork側ドキュメントの「不具合中」と実コードが食い違っており、ここを確定しないと後続判断がぶれる。
2. **台帳の営業時間ハードコード解消の方針決定** — `businessStart/End="10:00"/"23:00"` と「startTime空→10:00」の挙動を、店舗設定マスタ導入と合わせてどう直すか確定（「10時ずれ」の根本）。
3. **DB設計の二系統（旧`db-schema.md` vs 新`supabase-db-design.md`/`schema.sql`）の正本を一本化**。

### P1（予約・売上・顧客で必須）

4. Supabaseキー設定→認証有効化→マスタ（staff/services/rooms/shifts）からDB接続（`supabase-migration-plan.md` の順）。
5. 予約作成のPM相当項目（オプション/割引/インターバル/性別/こだわり/タグ/指名/連続）拡充。
6. メニュー別利用可能ブース（course_booth_assignments相当）の実装＋仕様化。
7. 予約一覧テーブル・予約集計バー・当日情報3タブ。

### P2（後でよい）

8. 日次管理・会計・レジ・経営指標ダッシュボード（**まずPMスクショ確認と仕様化が先**）。
9. 経費/決済/TORICOM等のマスタ、メール管理、物販。
10. 診断用 `console.log` の本番前削除、Vercelデプロイ。

---

## 確認できなかった点（明示）

会計・日次管理・経費・決済マスタ・物販・オプション・TORICOM・各経営指標帳票は、**コード・SQL・docs のいずれにも該当が見当たらず「確認できません」**。これらは仕様起こしの前に PeakManager 該当画面のスクショ確認が必要。
