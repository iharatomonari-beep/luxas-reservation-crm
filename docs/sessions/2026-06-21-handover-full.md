# セッション 2026-06-21（全体引き継ぎ・完全版）

新しいセッションは、まず CLAUDE.md → このファイルの順で読むこと。作業ディレクトリ: `/Users/C.C/claude code/luxas-reservation-crm`。

最初に状態確認:
```bash
cd "/Users/C.C/claude code/luxas-reservation-crm"
git status --short
git log --oneline -8
npx tsc --noEmit && npm run lint
# devは既に :3001 で稼働していることが多い（落ちていたら PORT=3001 npm run dev）
```

---

## やったこと（このセッション・2026-06-21）

### シフト時間の復活＋台帳ソート（commit `f800d3a`）
- 全スタッフ一律 10:00-20:00 だったシフトを **早番10-19 / 中番12-21 / 遅番14-23** の3帯に復活（PM実データ移行時に失われたバリエーションの回復）。各店舗の表示順で循環割当（`generateSeedShifts` / `buildStaffBandMap` in `mock-data.ts`）。定休曜日は従来どおり個別維持。
- 台帳タイムラインの縦軸を **「その日の出勤開始が早い順」** に自動ソート（同時刻は表示順）。`getEarliestShiftStartMinutes` 追加（`reservation-ledger.tsx`）。
- 再シードトークン更新: `luxas-master-shifts-v2 = 2026-06-21-shifts-early-mid-late-bands`。

### メニュー明細のPM準拠作り込み（commit `a488364`）
- `ServiceMenu` に **コース種別 / ジャンル1-3 / 店舗適用開始終了日 / 時間・曜日限定**（`availableDays`/`availableTimeStart`/`availableTimeEnd`）を任意追加（画像はスキップ）。
- `features/master-data/menu-genres.ts` 新設（ジャンル18種・コース種別・曜日定数）。
- メニュー管理(`service-manager.tsx`)のフォームに各項目を追加、一覧にジャンル/「限定」バッジ。
- **予約作成まで制御**: `isMenuAvailableForDateTime`（`reservation-ledger.tsx`）で、限定外の曜日・時間ではコース候補から除外＋送信時ブロック。

### 物販・オプションのPM実データ取り込み（commit `44388f6`）
- 物販: カテゴリ6件＋商品62件（`initialRetailCategories`/`initialRetailItems`）。
- オプション: 236件（延長/割引/その他を kind 判定、延長分数・割引率を抽出）。
- 取り込み方針: **有効のみ・現役7店舗＋本部・名前+価格で重複排除**（RetailItem/ServiceOptionは店舗スコープ非対応の型のため全店共通フラット）。
- 生成スクリプト: `scripts/gen-pm-retail.mjs` / `scripts/gen-pm-options.mjs`（再実行で `mock-data.ts` を再生成。入力CSVは `docs/reference/pm-retail-*.csv` / `pm-options.csv`＝git対象外）。
- 再シードトークン追加: `luxas-retail-categories` / `luxas-retail-items` / `luxas-master-options` = `2026-06-21-...`。
- 注意: PM物販マスタには「インバウンド60」等の施術系・「受付」「LINE@抽選梅昆布茶」(¥0)など実態のまま含む。不要分は画面で無効化可。
- **セット商品は未取り込み**（ユーザー判断で一旦保留。CSV未受領）。

### オンライン予約（自前の公開予約ページ）（commit `d230b65`）★主機能
- 背景: 現状オンライン予約は外部PMページのみ。HP店舗ページにリンク＋EPARK製アプリからそのPMページに飛ばして受けている。これを **このCRM内に自前で内製**し、将来リンク先を差し替え可能にするのがゴール。
- 公開ルート **`app/book/[storeId]/page.tsx`**（認証なし・店舗別URL。例 `/book/store-shibuya`）。Next15のasync params。
- `features/online-booking/online-booking-page.tsx`: ①コース選択（`onlineBooking`かつ当該店舗）→②日付・指名・空き時間→③お客様情報→完了（受付番号）。
- `features/reservations/availability.ts`（新規・純粋関数で共有化）:
  - `isMenuAvailableForDateTime` / `findStaffShiftStatus`（ledgerからロジック移植・export）、`onlineMenusForStore`、`getOpenStartTimes`、`pickAutoStaff`。
  - 空き判定 = メニュー限定 ＋ オンライン停止枠(`online-blocks`)外 ＋ 担当（指名 or 出勤者）がシフト内 ＋ 予約重複なし ＋ ブース容量(`hasBoothCapacity`再利用)。無指名は対応スタッフから自動割当。表示間隔30分。
- `Reservation.source?: "online" | "manual"` を非破壊追加。確定時にゲスト`Customer`を新規作成し`customerId`紐付け、同じ`reservationsStorageKey`に保存→**台帳・予約一覧に自動反映**。一覧に「オンライン」バッジ。
- `online-blocks.tsx` の型/キー/初期値を export（空き計算に接続）。
- 店舗設定 `onlineReservationEnabled` の**初期値を true（公開）**に変更（`store-settings.ts`）。OFFだと公開ページは受付停止表示。

## 現在の状態
- `npx tsc --noEmit` / `npm run lint` ともにクリーン。
- ローカル＝`origin/main` 一致（全てpush済み・最新 `d230b65`）。
- 未コミットは `.claude/settings.local.json`(M) と `docs/reference/`(未追跡) のみ＝いずれも運用上git対象外。
- 機能完成度: シフト/コース/メニュー明細/物販/オプション/オンライン予約公開ページ = 実装済み・型/lintクリーン。
- セット商品取り込み = 未着手（保留）。

## 次にやること（優先順）
1. **オンライン予約の実機確認**（ユーザー手元で未完了）: `/dashboard/settings` の「オンライン予約を公開する」を**ON保存**してから `/book/store-shibuya` を開く。コース→日付→指名→時間→情報→予約 が通り、台帳・一覧に「オンライン」バッジ付きで出るか確認。`online-blocks`で当日枠を止めると空き候補から消えるか確認。
   - 注意: `store-settings` は再シードトークン機構が無く、既存localStorageの保存値が優先される。初期値trueにしたが、既に保存済みなら設定画面でON保存が必要。
2. オンライン予約の作り込み続き（必要に応じ）: メール確認送信／予約確認・キャンセル画面／会員ログイン／店舗別の設定・停止枠・ブーススコープ化（現状いずれも単一保持）。
3. セット商品(`/HeadquarterCourseSets`)のCSV取り込み（コース/物販と同方式）。
4. （任意）メニュー特例の手入力反映（工藤「金〜17:30」、隔週休み等）はユーザーが手動対応する方針。

## 判断・決定事項
- データ入力は **A=シード書き換え方式**。再シードは **トークン方式**（`SEED_RESET_TOKENS` in `local-storage.ts`）。構造変更時はトークン更新必須。
  - 現行トークン: shifts=`2026-06-21-shifts-early-mid-late-bands`、retail-categories/items=`2026-06-21-retail-pm`、options=`2026-06-21-options-pm`、services=`2026-06-21-services-pm-all375`、categories=`2026-06-21-categories-pm14`、staff=`2026-06-21-staff-pm7stores-courses`、rooms=`2026-06-13-booths-10`、checkout-items=`2026-06-20-checkout-6kinds`。
  - **例外**: `store-settings`（key `luxas-store-settings`）と `reservations`（`luxas-reservations-v2`）はトークン機構の対象外。store-settingsは保存値優先のため初期値変更が既存ユーザーに効かない点に注意。
- PM実データ取り込みの共通ルール: **有効のみ／現役7店舗＋本部／名前+価格で重複排除**。閉店・別ブランド（Fudan-Ism/新橋/L溝の口）は除外。
- オンライン予約はプロトタイプ既定で **ゲスト予約（ログインなし）／店舗別URL／空き枠30分間隔／指名なし=自動割当**。決済・ポイント・回数券・LINE・メール・店舗別スコープ化は今回スコープ外。
- 店舗ID対応: 渋谷=store-shibuya / 五反田東=gotanda-east / 五反田西=gotanda-west / 錦糸町=kinshicho / 溝の口プレミアム=mizonokuchi-premium / 横浜元町=motomachi-chukagai-plus / 中目黒=nakameguro。

## 既知の問題・注意点
- **`<invoke>`/`<parameter>` を本文に表示しない**。Bash/Editは実ツール実行。本文表示が再発したらそのセッションは破棄して新セッションへ。
- **コード修正のたびに**ブラウザで実機確認してもらう（①tsc/lint ②`open "http://localhost:3001/該当URL"` ③目視 ④OK後に次へ）。記憶: `memory/feedback-open-browser-after-edit.md`。
- dev稼働中に `npm run build` をしない（`.next`破損）。型確認は `npx tsc --noEmit`。
- `useLocalCollection` には安定参照（`initial*` か `EMPTY_*`）を渡す。インライン`[]`/`{}`は無限ループ。
- 予約mockが参照するstaff idは `staff-001`/`staff-002`（渋谷先頭2名）。変更時は壊さない。
- `RetailItem`/`ServiceOption`/`StoreSettings`/`OnlineBlock`/`ServiceRoom` は店舗スコープ未対応（単一/全店共通）。マルチ店舗のオンライン予約を厳密化するなら型拡張が前提。
- `findShiftForReservation`/`isMenuAvailableForDateTime` は ledger 内ローカル版と `availability.ts` の共有版が**重複**している（今回は最小変更のため統合せず）。将来 ledger 側を共有版に寄せると重複解消できる。
- `docs/reference/`（pm-courses.json / pm-retail-*.csv / pm-options.csv 等）と `.claude/settings.local.json` は git 対象外。

## 主要ファイル早見
- シード（スタッフ/シフト/コース/カテゴリ/ブース/物販/オプション）: `features/master-data/mock-data.ts`
- マスタ型: `features/master-data/types.ts` ／ 予約型: `features/reservations/types.ts`
- 再シード機構・トークン: `features/master-data/local-storage.ts`
- メニュー管理: `features/master-data/service-manager.tsx`（`/dashboard/services`）／ ジャンル定数: `menu-genres.ts`
- 物販管理: `/dashboard/retail-items` ／ オプション: `/dashboard/options`
- 台帳: `features/reservations/reservation-ledger.tsx` ／ 予約一覧: `reservation-list.tsx`
- **オンライン予約（公開）**: `app/book/[storeId]/page.tsx` ＋ `features/online-booking/online-booking-page.tsx` ＋ `features/reservations/availability.ts`
- オンライン停止枠: `features/store-ops/online-blocks.tsx`（`/dashboard/online-blocks`）
- 店舗設定: `features/master-data/store-settings.ts` ＋ `features/store-settings/store-settings-manager.tsx`（`/dashboard/settings`）
- 組織(店舗): `features/org/mock-data.ts` / `features/org/use-current-store.ts`
- PM取り込みスクリプト: `scripts/gen-pm-courses.mjs` / `gen-pm-retail.mjs` / `gen-pm-options.mjs`
- PM生データ: `docs/reference/`（pm-courses.json / pm-retail-items.csv / pm-retail-categories.csv / pm-options.csv ほか）
