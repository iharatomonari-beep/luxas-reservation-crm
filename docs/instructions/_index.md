# Cowork からの実行キュー（_index）

このファイルは現在の実行キューです。

## 最初に読むルール

- Claude Code は、**必ず `docs/instructions/_execution-policy.md` を最初に読む**。
- `_execution-policy.md` を読まずに、この `_index.md` のタスクを実行してはいけない。
- そのうえで、下の「実行キュー」の**状態が「未実行」のタスクを実行順（最小番号）から1つずつ**処理する。
- 各タスクの安全レベル（SAFE / CAUTION / STOP）に従う。SAFE は自動実行、CAUTION は実行前に確認、STOP は実行せず停止。
- 1タスク完了するごとに、この表の「状態」を更新し、`docs/sessions/YYYY-MM-DD.md` に結果を追記する。

## 実行キュー

| 実行順 | タスクID | ファイル | 状態 | 安全レベル | 概要 | 停止条件 |
|---|---|---|---|---|---|---|
| 1 | T001 | `T001-drag-move-verify.md` | 完了 | SAFE | 予約枠ドラッグ移動の静的確認（実装変更なし・診断ログ温存） | lint/build失敗時のみ |
| 2 | T002 | `T002-store-settings.md` | 完了 | CAUTION | 店舗設定マスタ導入（型＋初期値、台帳/作成の参照差し替え。画面は後回し） | 保持方式の判断に迷う場合／実行前に確認 |
| 3 | T004 | `tasks/T004-tailwind-content-features.md` | 完了 | CAUTION | **【最優先・緊急修正】** Tailwind content に features/ 追加（予約カードが時刻位置に並ばない不具合の根治） | 実行前に確認／lint・build失敗時／指示外ファイル変更が必要なら停止 |
| 4 | T006 | `tasks/T006-empty-break-times.md` | 完了 | CAUTION | 初期シフトデータの休憩時間を空に（休憩で予約移動がブロックされる問題の緩和） | 実行前に確認／mock-data.ts以外の変更が必要なら停止 |
| 5 | T003 | `T003-fix-10am-fallback.md` | 完了 | CAUTION | 「10時ずれ」根治（方針A=固定"10:00"を店舗設定の受付開始時刻に置換。台帳/作成とも） | 方針A/Bの判断で停止可。T002未完了なら停止／実行前に確認 |
| 6 | T005 | `tasks/T005-ledger-drag-ux.md` | 完了 | CAUTION | 【実装済】ドラッグUX仕上げ＝ドロップ先スタッフ行ハイライト＋移動中の時刻バッジ（5分スナップ値）追加。既存ロジックは不変 | 実機確認が必要／T004依存／実行前に確認 |
| 7 | T007 | `tasks/T007-timeline-basic-full-view.md` | 完了 | CAUTION | タイムライン「基本/全体」切替（基本=16px・現在時刻起点／全体=画面幅にフィット＝コマ幅可変） | 5時間起点等の判断で停止可／実機確認／実行前に確認 |
| 8 | T008 | `tasks/T008-expand-booths.md` | 完了 | CAUTION | ブースマスタを施術8＋個室2＝計10に（容量の定義として使う。新ブース方式の土台） | 完了済み |
| 9 | T009 | `tasks/T009-shift-time-coloring.md` | 完了 | CAUTION | タイムラインでシフト時間を色分け（シフト内=白／シフト外=薄いグレー・全スタッフ同色） | 実機確認が必要／ledger以外の変更なら停止／実行前に確認 |
| 10 | T010 | `tasks/T010-menu-private-room-flag.md` | 完了 | CAUTION | メニューに「個室必須」フラグ追加＋ブース容量判定ヘルパ（判定差し替えはT011） | 個室必須メニューの判断は要確認／実行前に確認 |
| 11 | T011 | `tasks/T011-booth-auto-capacity.md` | 完了 | CAUTION | 予約のブース固定を撤去→容量ベース判定に作り直し（移動時のブース重複ブロック解消）。T010依存 | 実機確認が必要／roomId型削除は停止／実行前に確認 |
| 12 | T012 | `tasks/T012-bump-rooms-storage-key.md` | 完了 | CAUTION | ブース規定数10を反映。Coworkが直接修正＝(1)roomsキーをv2に (2)local-storage.tsにseed自動再シード機構を追加し、古いlocalStorageを読込時に初期10件へ強制上書き。lint通過 | — |
| 13 | T013 | `tasks/T013-seed-staff-shifts.md` | 完了 | CAUTION | 仮スタッフ8人＋2ヶ月分シフト（週5・9時間・定休曜日固定・土日厚め）を生成＋staff/shifts自動再シード | — |
| 14 | T014 | `tasks/T014-store-hours-screen.md` | 完了 | CAUTION | 営業時間の設定画面（/dashboard/settings）を作成。画面のみ実装（台帳との実連動はledgerがinitialStoreSettings定数参照のため別途要対応） | T002連携不明なら停止／実機確認／実行前に確認 |
| 15 | T015 | `tasks/T015-weekly-shift-pattern-editor.md` | 完了 | CAUTION | シフト画面を曜日別チェック＋時間設定に作り直し。今日〜2ヶ月生成・期間内上書き。週次パターン型は新設せず既存シフトから復元 | 週次パターン型の要否で停止可／実機確認／実行前に確認 |
| 16 | T016 | `tasks/T016-compress-timeline-row.md` | 完了 | CAUTION | タイムライン行高さを96→64(2/3)に圧縮＋予約カードを3行に詰めて枠内に収める。Coworkが直接修正・lint通過 | — |
| 17 | T017 | `tasks/T017-nomination.md` | 完了 | CAUTION | 【再改訂版実装済】担当選択撤去。指名は「現担当を固定するか否かのトグル1つ」（作成/編集・詳細とも・スタッフ選択UIなし）。指名予約は担当変更不可 | 実機確認／実行前に確認 |
| 18 | T018 | `tasks/T018-ledger-ui-peakmanager-layout.md` | 完了 | CAUTION | 【PM準拠①実装済】左縦レール(予約=新規/顧客=リンク、他は準備中無効)＋下部ツールバー(カテゴリ絞り込み=機能、集計▼/インターバル/ひな型=準備中) | 先行未完なら保留／実機確認／実行前に確認 |
| 19 | T019 | `tasks/T019-ledger-summary-bar.md` | 完了 | CAUTION | 【PM準拠②実装済】予約集計バー。実値=総来店/施術件数/取消/予約中/完了、ダミー=売上・支払・目標・新規/リピート/客単価(会計未実装・要確認注記) | 新規/リピート/客単価の定義で停止可／実機確認 |
| 20 | T020 | `tasks/T020-booking-modal-pm.md` | 完了 | CAUTION | 【PM準拠③実装済】コース選択=カテゴリ色分けグループ一覧(機能)。こだわり/予約タグ/割引/連続/インターバルは枠のみ(未保存)。保存対応は型/マスタ追加=別タスク提案 | マスタ新設要否で停止／実機確認 |
| 21 | T021 | `tasks/T021-reservation-list.md` | 完了 | CAUTION | 【実装済】予約一覧画面（/dashboard/reservations/list）。日付/顧客名で絞込・行→台帳遷移・sidebarにリンク追加。性別/リピート/会計/経路は「-」 | 実機確認／型追加なら確認 |
| 22 | T022 | `tasks/T022-checkout-payment.md` | 完了 | CAUTION | 【実装済・推奨構造】Reservationに paymentStatus/saleAmount/payments[] 追加。予約詳細に「会計」ボタン→会計モーダル(売上額＋支払方法複数)。詳細に会計状況表示 | 会計型を実行前に確認／実機確認 |
| 23 | T023 | `tasks/T023-monthly-shift-grid.md` | 完了 | CAUTION | 【実装済】月間グリッド(/dashboard/shifts/monthly)。日付×スタッフの出勤チェック＋時刻(即保存)、日次目標¥/コメント(新キーluxas-daily-targets)、前月/翌月、sidebarリンク | 既存シフト統合方針／実機確認 |
| 24 | T024 | `tasks/T024-menu-category-option-master.md` | 完了 | CAUTION | 【実装済】カテゴリ管理(/dashboard/categories)＋オプション管理(/dashboard/options)。型MenuCategory/ServiceOption・初期データ・CRUD・sidebar。既存service.category文字列と並存(再シード追加なし) | カテゴリ紐付け／再シード追加は確認 |
| 25 | T025 | `tasks/T025-tags-and-full-search.md` | 完了 | CAUTION | 【実装済】タグマスタ(顧客/予約ルート/カルテ・種別切替CRUD・/dashboard/tags)＋顧客フル検索(/dashboard/customers/search・多条件)。既存customer-managerは不変・並存 | タグ整合／customers破壊はSTOP |
| 26 | T026 | `tasks/T026-booking-returns.md` | 完了 | CAUTION | 【実装済】返客一覧(/dashboard/reservations/returns)。status=canceled流用・期間絞込・sidebar。種別/理由/タグは要マスタ化注記で「-」 | 返客判定方針／実機確認 |
| 27 | T027 | `tasks/T027-daily-ops.md` | 完了 | CAUTION | 【実装済】日次管理(/dashboard/daily)＝出勤退勤打刻/レジ金(開店/点検/閉店・金種テーブル)/売上日報(会計集計)/経費登録(前月コピー)＋経費マスタ(/dashboard/expense-accounts)。月間目標はT023の日次目標を流用 | 会計依存はT022先行／実機確認 |
| 28 | T028 | `tasks/T028-analytics.md` | 完了 | CAUTION | 【実装済】経営指標(/dashboard/analytics)＝スタッフ別/商品別売上・時間帯別来店・顧客数推移を簡易バー。トップにKPIカード。物販は枠のみ。**グラフlibは追加せず**(STOP方針) | グラフlib追加はSTOP／実機確認 |
| 29 | T029 | `tasks/T029-payment-other-masters.md` | 完了 | CAUTION | 【実装済】クレカ会社マスタ(/dashboard/creditcards)＋電子マネーマスタ(/dashboard/emoney)＝共通FeeMasterManagerでCRUD・初期データ・sidebar。ユーザ/認証/TORICOMは未着手(STOP遵守) | 認証/ユーザ踏込はSTOP／実機確認 |

| 30 | T030 | `tasks/T030-reservation-data-complete.md` | 完了 | CAUTION | 【実装済】Reservation拡張(preference/bookingTagIds/optionIds/discount系/isConsecutive)。受付モーダルで保存(こだわり/予約ルートタグ/オプション/割引/連続)。comment=memo流用・編集で再表示 | 保存形式・storage再シードは推奨で進め報告／実機確認 |
| 31 | T031 | `tasks/T031-store-hours-runtime.md` | 完了 | CAUTION | 営業時間設定を台帳にランタイム連動（定数参照をやめ店舗設定localStorageを読む）。T014積み残し【実装済・実機確認待ち】 | create-page波及で大きければledgerのみで止め報告／実機確認 |
| 32 | T032 | `tasks/T032-retail-sales.md` | 完了 | CAUTION | 物販マスタ＋物販販売登録・明細【実装済・実機確認待ち】 | 会計結合は将来／再シード追加は確認／実機確認 |
| 33 | T033 | `tasks/T033-checkout-master-link-analytics.md` | 完了 | CAUTION | 会計の支払選択肢を決済マスタと結合＋集計/経営指標を実値化。T022/T029依存【実装済・実機確認待ち】 | 依存未了なら停止／新規リピート定義は推奨／実機確認 |
| 34 | T034 | `tasks/T034-customer-detail-enrich.md` | 完了 | CAUTION | 顧客詳細充実（来店/予約履歴・カルテ・注意事項・タグ・会員情報）【実装済・実機確認待ち】 | import破壊はSTOP／型追加は推奨で進め／実機確認 |
| 35 | T035 | `tasks/T035-reservation-status-cancel.md` | 完了 | CAUTION | 予約ステータス・キャンセル管理（取消/無断キャンセル/理由/日時→集計に反映）【実装済・実機確認待ち／一覧のキャンセル日時列は対象外ファイルのため別途】 | 型設計は推奨で進め／実機確認 |
| 36 | T036 | `tasks/T036-day-info-panel.md` | 完了 | CAUTION | 当日情報パネル3タブ化（予約情報/販売情報/返客情報）【実装済・実機確認待ち】 | レイアウト大改変は分割／実機確認 |
| 37 | T037 | `tasks/T037-discount-interval-consecutive.md` | 完了 | CAUTION | 割引/インターバル/連続予約の計算・挙動を実装。T030依存【実装済・実機確認待ち／割引=売上見込表示・四捨五入、interval=同一担当重複に加算（容量helperは対象外）、連続=次枠プリフィル】 | T030未了なら停止／端数処理は推奨／実機確認 |
| 38 | T038 | `tasks/T038-mail-management.md` | 完了 | CAUTION | メール管理一式（定型文/対象抽出/配信履歴/eDM）※実送信なしモック。実機内部未巡回=PM標準で設計【実装済・実機確認待ち／PM標準設計・要実機再確認】 | 実送信/依存追加はSTOP／要実機再確認 |
| 39 | T039 | `tasks/T039-analytics-reports-detail.md` | 完了 | CAUTION | 経営指標 詳細帳票（売上明細/クレジット別/日次集計/帳票CSV）。会計依存。実機内部未巡回=PM標準で設計【実装済・実機確認待ち／CSVは既存serializeCsv流用・lib追加なし】 | グラフlib追加はSTOP／要実機再確認 |
| 40 | T040 | `tasks/T040-store-settings-sections.md` | 完了 | CAUTION | 店舗設定の拡張(業務設定/会員番号発行/予約用HP/オンライン予約・通知/インボイス)※実連携なし【実装済・実機確認待ち／StoreSettings任意拡張・折りたたみセクション】 | 外部連携/認証/決済はSTOP／要実機再確認 |
| 41 | T041 | `tasks/T041-loose-ends-integration.md` | 実行中 | CAUTION | 積み残し整合: 予約一覧キャンセル日時列／会計モーダル売上見込プリフィル／hasBoothCapacityにインターバル反映【実装済・実機確認待ち／売上見込はmock-dataに共用helper化しT037と一致】 | 売上見込はT037と一致／指定外ファイルはSTOP／実機確認 |

> 現在、未実行タスクはありません。T030〜T040 は実機確認OK（2026-06-14）で「完了」。T041 は実装済・実機確認待ち（実行中）。
> 旧: 未実行タスク（推奨順）: **T030→T031→T032→T033→T034→T035→T036→T037→T038→T039→T040**。
> 補足: T038/T039/T040 はPM画面の内部まで実機巡回していないため「PM標準で設計・相違あれば実機再確認」。実送信/外部連携/決済/認証/依存追加はSTOP。
> 設計書: `~/Desktop/pm_スクリーンショット/LUXAS_docs/luxas-build-spec-from-pm.md`。
> 設計書: `~/Desktop/pm_スクリーンショット/LUXAS_docs/luxas-build-spec-from-pm.md`。
> ⚠️ ledgerを触るT030/T031/T033は同一ファイル衝突に注意し1つずつ。
> 全機能の設計書: `~/Desktop/pm_スクリーンショット/LUXAS_docs/luxas-build-spec-from-pm.md`（PM準拠・優先度つき。T021〜T029が対応）。
> PM準拠 推奨順: 台帳(T018→T019→T020)→ P1(T021→T022→T026)→ P2(T024→T025)→ T023 → P3(T027)→ P4(T028)→ P5(T029)。

> ⚠️ 多数のタスクが「実行中（実機確認待ち）」です。**まず実機確認→「完了」化を先に**: T007/T009/T014/T015/T003、および未実行のT017。
> その後、PM準拠の作り込みを順に: **T018 →（実機OK）→ T019 →（実機OK）→ T020**。
> ⚠️ T005/T007/T009/T017/T018/T019/T020 は同じ `reservation-ledger.tsx` を編集するため**必ず1つずつ・並行編集しない**。
> 備考: T012 は 2026-06-13 に Cowork が `roomsStorageKey="luxas-master-rooms-v2"` へ直接修正（lint通過）。「更新で一瞬10→2に戻る」現象（localStorage上書き）の根治。
> 実行順テーブルは番号順だが、推奨順を優先してよい。
> 未実行タスクが無くなった場合は、この表の下に「現在、未実行タスクはありません」と記載する。

## 状態の値

- `未実行` … まだ着手していない
- `実行中` … 着手したが完了条件未達
- `完了` … 完了条件を全て満たした
- `停止` … 停止条件に当たって中断（理由を sessions に記録）
- `保留` … ユーザー判断待ち等で意図的に止めている

## 補足

- 既存の `T001`〜`T003` のタスクファイルは歴史的経緯で `docs/instructions/` 直下にある。**新規タスク（T004〜）は `docs/instructions/tasks/` 配下に作成する**（作成ルールは `docs/instructions/tasks/README.md`）。
- T001 は 2026-06-13 実行済み（ドラッグ移動は基本的に仕様と一致、lint/build OK、コード変更なし。詳細は `docs/sessions/2026-06-13.md`）。
- T001 の留置点（ドラッグ中の横スクロールで座標がズレる可能性・仕様未定義）は必要時に別タスク化する。
- ドラッグ診断ログ `[drag:start]` / `[drag:move]` / `[drag:drop]` の削除は、ユーザーの実機確認OK後に別タスク（安全レベル STOP「実機確認が必要」付き）として追加する。
