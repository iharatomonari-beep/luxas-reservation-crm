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
| 41 | T041 | `tasks/T041-loose-ends-integration.md` | 完了 | CAUTION | 【実機確認OK 2026-06-15】積み残し整合: 予約一覧キャンセル日時列／会計モーダル売上見込プリフィル／hasBoothCapacityにインターバル反映（売上見込はmock-dataに共用helper化しT037と一致） | 売上見込はT037と一致／指定外ファイルはSTOP／実機確認 |
| 42 | T042 | `tasks/T042-ledger-pm-layout-step1-timeline-first.md` | 完了 | CAUTION | 【完了・実機OK】PM配置寄せStep1。タイトル/説明文/サマリ3枚を削除。ルートをflex化しorderでPM順=ヘッダ→status→debug→タイムライン→当日情報3タブ→選択中→保留棚。ロジック不変（order方式） | 指定外ファイルはSTOP／ロジック変更が必要なら停止／lint・build失敗で停止／実機確認 |
| 43 | T043 | `tasks/T043-guest-booking-and-cti-phone.md` | 完了 | CAUTION | 【完了・実機OK】顧客名・電話を任意化＝ゲスト登録可（既定「ゲスト」・空保存で「ゲスト」）。両作成フォーム対応。＋CTI着信番号を `/dashboard/reservations/new?tel=番号`（無ければ?phone=）で電話欄に自動入力・?name=で顧客名。Reservation型変更なし | Reservation型追加が要るなら停止／指定外ファイルはSTOP／lint・build失敗で停止／実機確認 |
| 44 | T044 | `tasks/T044-nav-pm-top-menu.md` | 完了 | CAUTION | 【実機確認OK 2026-06-15】左サイドバー撤去→PM風 上部ドロップダウンメニュー（top-menu.tsx新規＋dashboard-shell.tsx改修）。7グループ・全ルート到達・PCバー/モバイルアコーディオン・active表示。sidebar.tsxは残置（未使用）。lint/build OK | sidebar.tsx削除はSTOP／指定外ファイルはSTOP／lint・build失敗で停止／実機確認 |
| 45 | T045 | `tasks/T045-ledger-display-pm-align.md` | 完了 | CAUTION | 【実機確認OK 2026-06-14】上部日付バーをコンパクト化（`<今日>`/再読込/現在時刻、天気/すべて/店舗はプレースホルダ）＋表示タブ5種（シフト/ブース/両方は準備中）＋予約集計バーをタイムライン下へ移動＋ドラッグ用横長帯＋シフト追加リンク。reservation-ledger.tsx 1ファイル中心 | 指定外ファイルはSTOP／計算ロジック変更が必要なら停止／ドラッグ結線が重ければ説明帯のみで報告／lint・build失敗で停止／実機確認 |
| 46 | T046 | `tasks/T046-ledger-rail-wiring.md` | 完了 | CAUTION | 【完了 2026-06-15・ユーザーOK（実機は後日確認）】【台帳・左レール結線】開く=選択予約詳細/返客=返客一覧/会計=会計モーダル/顧客=顧客。カードは準備中明示。reservation-ledger.tsx | 指定外ファイルSTOP／lint・build失敗で停止／実機確認 |
| 47 | T047 | `tasks/T047-booking-course-category-tabs.md` | 完了 | CAUTION | 【完了 2026-06-15・実機OK】【予約受付】コース選択を`<select>`→カテゴリ色分けタブ＋一覧に。保存/計算は不変。台帳インライン＋専用画面 | 指定外ファイルSTOP／崩れたら台帳のみ先行報告／実機確認 |
| 48 | T048 | `tasks/T048-booking-list-columns-pm.md` | 実行中 | CAUTION | 【実装済・実機確認待ち】【予約一覧】列をPM順＋実値化（売上/会計状況/キャンセル日時/性別/リピート/経路は可能な範囲）＋総販売額/検索条件追加。reservation-list.tsx | customers破壊STOP／実機確認 |
| 49 | T049 | `tasks/T049-payments-register-page.md` | 実行中 | CAUTION | 【実装済・実機確認待ち】【新規】支払・レジ一覧(/dashboard/payments)。当日会計を支払方法別表示＋メニュー導線。会計データ参照のみ | 会計構造変更が要れば停止／依存追加STOP／実機確認 |
| 50 | T050 | `tasks/T050-booking-returns-columns.md` | 実行中 | CAUTION | 【実装済・実機確認待ち】【返客一覧】列PM順＋種別/返客理由/予約タグ実値化。booking-returns.tsx | 指定外ファイルSTOP／実機確認 |
| 51 | T051 | `tasks/T051-master-split-panel-component.md` | 完了 | CAUTION | 【完了・lint/build OK／単体は画面変化なし】【共通UI】PMスプリットパネル・マスタUIコンポーネント新規（左一覧+検索/新規、右明細設定）。既存画面は未変更 | 依存追加STOP／lint・build失敗で停止 |
| 52 | T052 | `tasks/T052-masters-to-split-panel.md` | 実行中 | CAUTION | 【7/7実装済・実機確認待ち（スタッフ/ブース/経費/クレカ/電子マネー/カテゴリ=スプリット化、顧客=既存充実検索構成に会員番号/ID列追加）。lint/build OK・プレビューでスタッフ/クレカ確認済】【マスタ統一】スタッフ/ブース/経費/クレカ/電子マネー/顧客/カテゴリをT051形式へ（1画面ずつ）＋不足列。CRUD維持 | データ構造変更で停止／1画面ずつ／実機確認 |
| 53 | T053 | `tasks/T053-products-expand.md` | 完了 | CAUTION | 【完了 2026-06-15・実機OK（セット商品/物販カテゴリ/EPARK表示確認OK）。①〜④実装済。①オンライン予約○×／②セット商品/dashboard/course-sets新規／③物販カテゴリ/dashboard/retail-categories新規(省略名追加・既存データ共有・破壊的再シードなし)／④EPARK設定/dashboard/epark新規。メニュー導線追加・lint/build OK(35頁)】【商品拡充】メニュー/オプションにオンライン予約○×＋セット商品/物販カテゴリ/EPARK掲載 新規（1項目ずつ） | 再シードで既存物販破壊なら停止／依存追加STOP／実機確認 |
| 54 | T054 | `tasks/T054-tags-split-three.md` | 実行中 | CAUTION | 【実装済・実機確認待ち／顧客タグ・予約ルートタグ・施術カルテタグの3画面に分離（tag-managerをkind固定化＋スプリット化）。管理コードはroute/karteのみ。旧/dashboard/tagsは/customer-tagsへredirect。menu3項目。lint/build OK(38頁)】【タグ3分割】顧客/予約ルート/施術カルテの3画面＋管理コード。既存タグ参照維持 | データ移行は推奨で最小実装報告／指定外STOP／実機確認 |
| 55 | T055 | `tasks/T055-daily-ops-split.md` | 実行中 | CAUTION | 【実装済・実機確認待ち／DailyOpsにviewプロップ追加し6独立ルート化（出勤退勤/開店/点検/閉店/閉店処理検索/売上日報）＋日報をPM全項目(本日の結果/達成度/提案数/明日の予定/実施プラン/振り返り/シフト状況/天気)に拡張・一時保存/送信(モック)。締め/現金確定の実処理は作らず。旧/dashboard/dailyは統合タブ維持。menu追加。lint/build OK(44頁)】【日次分割】開店/レジ金点検/閉店/閉店検索/売上日報(PM全項目)/出勤退勤 を独立画面に（1画面ずつ） | 締め/現金確定の実処理は作らない停止／1画面ずつ／実機確認 |
| 56 | T056 | `tasks/T056-mail-five-screens.md` | 実行中 | CAUTION | 【実装済・実機確認待ち／MailManagerにviewプロップ追加し5ルート化(配信履歴=/mail・配信一括停止=/mail/cancel・定型文=/mail/templates・eDM=/mail/edm・シンプルeDM=/mail/edm-simple)。AutoTabにmode(edm/simple)絞り込み追加・CancelTab新規。実送信なしモック。menu5項目。lint/build OK(48頁)】【メール5画面】配信履歴/配信取消/定型文/eDM/シンプルeDM（実送信なしモック） | 実送信/外部連携/依存追加STOP／1画面ずつ／実機確認 |
| 57 | T057 | `tasks/T057-analytics-reports-pm.md` | 実行中 | CAUTION | 【実装済・実機確認待ち／詳細帳票(analytics-detail-reports)にスタッフ別/商品別/物販/時間帯別来店/帳票出力リンク集タブを追加（既存の売上明細/クレカ別/日次/顧客数推移に加え計9タブ）。各CSV出力(serializeCsv流用)・グラフlib追加なし。物販/会計未整備は0+注記】【経営指標拡充】スタッフ別/商品別/物販/時間帯/日次/クレカ別/顧客数推移＋CSV。帳票出力リンク集 | グラフlib/依存追加STOP／会計未整備は0+注記／実機確認 |
| 58 | T058 | `tasks/T058-store-settings-form-pm.md` | 実行中 | CAUTION | 【実装済・実機確認待ち／StoreSettingsにPM基本情報17項目(企業/エリア/店舗ID・コード・名称・略称・住所・電話/FAX/メール・HP・担当・背景色)を任意追加＋「基本情報」セクション。クレカ/電子マネー一覧(マスタ参照・読取)・店舗サマリ/ウィジェット枠を追加。営業時間連動キーは不変。lint/build OK】【店舗設定拡張】PM店舗マスタの基本フィールド＋アコーディオン群。営業時間連動維持 | 外部連携/決済/認証STOP／台帳連動維持／実機確認 |
| 59 | T059 | `tasks/T059-remaining-new-screens.md` | 実行中 | CAUTION | 【実装済・実機確認待ち／5画面追加: 本日のオンライン設定(/online-blocks)・シフトひな型(/shift-templates)・シフトパターン(/shift-patterns・スプリット)・データ不備(/data-errors・スプリット)・ユーザマスタ(/users・表示のみ・認証非接触)。menu導線追加。lint/build OK(53頁)】【残り新規画面】本日のオンライン設定/シフトひな型/シフトパターン/データ不備/ユーザマスタ(表示のみ)（1画面ずつ） | 認証/権限実装STOP／1画面ずつ／実機確認 |
| 60 | T060 | `tasks/T060-top-menu-complete-pm.md` | 実行中 | CAUTION | 【実装済・実機確認待ち／上部メニューをPM8グループ構成に最終調整。データ不備を予約台帳グループへ・ユーザ情報を店舗情報へ・月間目標入力を日次管理へ。全46リンクが実在ルートに対応＝死にリンク0（スクリプト検証済）。lint/build OK】【ナビ最終化】上部メニューをPM店舗8グループ全項目に（各ページ完成後）。死にリンク禁止。top-menu.tsx | 未実装へのリンクは載せず報告／指定外STOP／実機確認 |
| 61 | T061 | `tasks/T061-org-hierarchy-types-seed.md` | 完了 | CAUTION | 【完了 2026-06-15・既存画面不変・lint/build OK（UIなしのため実機確認不要）】【外販SaaS土台】tenant→area→store 階層の型・初期データを最小・非破壊で追加（features/org/ 新規。既存型/データ/画面は不変、強制FK追加なし）。株式会社東邦→東京→LUXAS渋谷 1件＋currentStoreId="store-shibuya" | 既存型/キー/画面の変更が要れば停止／依存追加STOP／lint・build失敗で停止 |
| 62 | T062 | `tasks/T062-org-admin-and-store-switcher.md` | 完了 | CAUTION | 【完了（実機確認OK 2026-06-15）／組織管理画面 /dashboard/org(テナント/エリア/店舗の3タブCRUD・スプリット)＋上部バー店舗切替セレクタ(use-current-store・localStorage luxas-current-store-id)＋店舗情報メニューに組織管理リンク。既存データは未scope(非破壊)・死にリンク0・lint/build OK(54頁)】【org管理＋店舗切替】tenant/area/store の管理画面 `/dashboard/org`＋上部バーに店舗切替セレクタ＋現在店舗をlocalStorage保持。T061依存。既存データのscopeは変えない（非破壊）。死にリンク禁止 | T061未実装なら停止／予約・顧客・会計の型/データ変更が要ればSTOP(=T063)／lint・build失敗で停止／実機確認 |
| 63 | T063 | `tasks/T063-reservation-store-scope.md` | 完了 | CAUTION | 【完了（実機確認OK 2026-06-15）／Reservationにstoreid?(任意)追加＋新規作成(台帳/専用画面)で現在店舗付与＋共通filterReservationsByStoreで台帳/予約一覧/返客/支払レジ/経営指標(reports/analytics/top-kpi)を安全フィルタ。既存予約は無付与のまま=渋谷で全件表示・他店舗は新規のみ。プレビュー確認: 渋谷10件→他店舗0件→渋谷10件復帰(非破壊)。lint/build OK】【予約を店舗scope・非破壊】Reservationに storeId?(任意)＋新規作成で現在店舗を付与＋台帳/一覧/返客/支払レジ/予約集計を安全フィルタ(storeId一致 or 未設定は既定店舗のみ)で絞る。既存データは消さない。設計メモ: LUXAS_docs/multi-store-scope-design.md。T061/T062依存 | データが消える挙動なら即停止／顧客・マスタscopeは停止(=T064以降)／会計構造変更は停止／lint・build失敗で停止／実機確認 |

> 【現況 2026-07-02 追記】日次集計（店舗向け）第2版を実装。追加列＝税抜/消費税（固定10%逆算）・オンライン(PC)/(携帯)（`Reservation.onlineDevice` 新設・UA自動判定）・機会損失率・追加提案数（売上日報の数値解釈）。健康アドバイス/RUUは定義未確定で見送り。付随して匿名RPC予約の `source:"online"` 欠落を修正（集計fallback＋★owner適用SQL `supabase/phaseC2-online-booking-device.sql`）。tsc/eslint green・実機 `npm run build` OK・phaseC2 SQL適用済み・コミット 4dd6575 をpush済み（いずれも2026-07-02）。詳細＝`docs/sessions/2026-07-02.md`。

> 【現況 2026-06-30 追記】機能追加キュー（引き継ぎ書の①②③④）を一括対応。①自動更新=実装完了／③new予約ルートタグ=実装完了／②顧客マージ=ツール・画面(/dashboard/customers/merge)・owner用SQL(`supabase/phase4-customer-merge.sql`)実装（★SQL適用＋#6/#8後に実マージ）／④TORICOM=調査のみSTOP(`docs/ops/toricom-hpb-integration-investigation.md`)。tsc/eslint . green。実機 `npm run build` は当環境(SWC)不可のため未実施＝ユーザー実機で最終確認。詳細＝`docs/sessions/2026-06-30.md`。

> 【現況 2026-06-15 再更新】
> - 完了: T001〜T047, T051, T053, T061（実機OK or UIなし）。
> - 実行中（実装済・lint/build OK・実機確認待ち）: **T048 / T049 / T050 / T052 / T054 / T055 / T056 / T057 / T058 / T059 / T060**。
> - T062 / T063 完了（実機確認OK 2026-06-15）。
> - 未実行タスクなし（T046〜T063 すべて実装完了）。次段階の候補は T064（顧客・スタッフ・メニュー等マスタの店舗/テナントscope設計／未登録）。
> - T061/T062/T063 は完了。T046〜T063 は実装完了。T048/T049/T050/T052/T054〜T060 は実機確認待ち（残るはユーザーの一括実機確認→確認後に「完了」化）。
> - T063により予約のみ店舗scope対応（非破壊・既定店舗=渋谷では既存全件表示）。顧客/マスタ/会計はscope対象外（共有のまま・T064で検討）。
> - 全体ビルド: 54ページ・lint/build エラー0・上部メニュー死にリンク0。reservation-ledger.tsx を触るのはT046/T047/T063（完了済）。
> 各タスクは安全レベル（ほぼCAUTION）に従い、完了条件・検証（lint/build＋実機確認）を満たしてから「完了」にする。STOP対象（削除/DB/認証/env/依存追加/実送信/外部決済/PMデータ変更）は止めて報告。
> 全体方針: PMに忠実に寄せる。設計の正本は `~/Desktop/pm_スクリーンショット/LUXAS_docs/pm-screen-structure-reference.md` と `pm-match-build-roadmap.md`。
> PM配置寄せの予定（台帳）: Step1=T042【完了】。続き（番号は作成時に採番）= 表示切替の5タブ化（基本/全体/シフト/ブース/両方）＋ドラッグ用横長バー＋シフト追加ボタン＋予約集計バーをタイムライン下へ／上部バー仕上げ（`<今日>`コンパクト・再読込・天気・すべて絞り込み・店舗セレクタ・時計）。これらはユーザーの優先順に応じてCoworkが順次作成。
> T030〜T040 は実機確認OK（2026-06-14）で「完了」。T041 は実装済・実機確認待ち（実行中）。
> 旧: 未実行タスク（推奨順）: **T030→T031→T032→T033→T034→T035→T036→T037→T038→T039→T040**。
> 補足: T038/T039/T040 はPM画面の内部まで実機巡回していないため「PM標準で設計・相違あれば実機再確認」。実送信/外部連携/決済/認証/依存追加はSTOP。
> 設計書: `~/Desktop/pm_スクリーンショット/LUXAS_docs/luxas-build-spec-from-pm.md`。
> 設計書: `~/Desktop/pm_スクリーンショット/LUXAS_docs/luxas-build-spec-from-pm.md`。
> ⚠️ ledgerを触るT030/T031/T033は同一ファイル衝突に注意し1つずつ。
> 全機能の設計書: `~/Desktop/pm_スクリーンショット/LUXAS_docs/luxas-build-spec-from-pm.md`（PM準拠・優先度つき。T021〜T029が対応）。
> PM準拠 推奨順: 台帳(T018→T019→T020)→ P1(T021→T022→T026)→ P2(T024→T025)→ T023 → P3(T027)→ P4(T028)→ P5(T029)。

> （以下は履歴メモ・現況は上記「現況 2026-06-15 更新」を正とする）
> ⚠️【履歴】旧ガイダンス: T007/T009/T014/T015/T003 等の実機確認→完了化、T018→T019→T020 の順。いずれも完了済み。
> ⚠️ reservation-ledger.tsx を編集するタスクは**必ず1つずつ・並行編集しない**（現行も有効なルール）。
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
