# セッション引き継ぎ書 2026-06-20（スタッフ取り込み／PM実データ化）

新セッションはこのファイルと CLAUDE.md を最初に読むこと。

---

## 0. このセッションでの運用ルール（必ず守る）

1. **コードを修正したら毎回その都度、実ブラウザで開いてユーザーに確認してもらう。**
   - 開くコマンド例: `open "http://localhost:3001/dashboard/staff"`
   - まとめて最後に一度ではなく、1修正ごとに開く。lint/`npx tsc --noEmit` を通してから開く。
   - 記憶: `memory/feedback-open-browser-after-edit.md`
2. **Bash を使うときは実際にツール実行する。** ツール呼び出しの XML風表記（invoke / parameter 等）を本文に絶対に表示しない。
   ユーザーに見せるのは「実行結果」か「ターミナルに貼れる通常の1行シェルコマンド」だけ。
3. **Cowork のキュー（docs/instructions/）は今は使っていない。** ユーザーが会話で直接「これを編集して」と指示する運用。
4. データ入力方針は **A=シードの書き換え**（コードの初期データを実データに置換）。localStorage 手入力ではない。

---

## 1. いまやっている大タスク

**PeakManager（PM）の実データを、各店舗ごとに本アプリへ取り込む。**
- 順番: ①スタッフ＋シフト（←今ここ・ほぼ完了）→ ②商品（コース）の取り込み（←次）。
- **PMで「非表示」のスタッフ・商品は不要**（退職者など）。一覧に出ている＝現役だけ入れる。
- PM URL: `https://pmn.peakmanager.com/Mains/sc_index`（ユーザーはログイン済み。Claudeはパスワード入力不可）。
- PM操作は Chrome拡張MCP（`mcp__Claude_in_Chrome__*`）。店舗に入る→ヘッダー「店舗情報→スタッフ情報」で各店のスタッフ一覧。
  - 一覧の最下部にページ番号(2,3…)が無ければその店は1ページで全員。番号があれば次ページも見る。

### PM店舗構成（3エリア・7店舗）
アプリ側 store id は `features/org/mock-data.ts` に既存（7店舗そろっている）。
| PM店舗 | アプリ store id |
|---|---|
| LUXAS渋谷 | store-shibuya（既定店舗） |
| LUXAS五反田東口 | store-gotanda-east |
| LUXAS五反田西口 | store-gotanda-west |
| LUXAS錦糸町 | store-kinshicho |
| LUXASプレミアム溝の口 | store-mizonokuchi-premium |
| LUXAS+横浜元町中華街 | store-motomachi-chukagai-plus |
| LUXAS中目黒 | store-nakameguro |
- 注: PMはエリアが東京/神奈川/五反田の3つだが、アプリ org は全店「東京」エリア配下（簡易）。必要なら別途エリア分割。
- 取得した全スタッフ生データは `docs/reference/pm-staff-import.md`（未追跡）に記録済み。

---

## 2. このセッションで完了した実装（スタッフ＋シフト）

すべて `npx tsc --noEmit` クリーン。**まだ git コミットしていない**（ユーザー指示があれば commit）。

### 変更ファイル
- `features/master-data/types.ts`
  - `StaffMember` に PM準拠の任意項目を追加: `employeeNumber, lastName, firstName, kanaLast, kanaFirst, nickname, gender("male"|"female"), phone, email, imageUrl, personalNomination, genderNomination, personalNominationFee, freeMessage, regularDayOffs(number[]・0=日〜6=土)`。
- `features/master-data/mock-data.ts`
  - `initialStaff` を **PM実データ7店舗・計59名** に置換（`STAFF_SEED` 配列から生成）。
    - 予約mockが参照する `staff-001`/`staff-002` は渋谷の先頭2名（王凡／西村 里呼）に割り当てて温存。
    - 各 staff に `homeStoreId`・`regularDayOffs`・`nickname`(PM定休表記)・`fullName`(姓+名)・`displayName`(姓) 等を付与。`serviceMenuIds` は空（=全コース対応、コース紐付けは後で）。
  - シフト生成 `generateSeedShifts()` を `regularDayOffs` ベースに刷新。定休曜日以外に **10:00〜20:00** を 2026-06-13〜08-13 で生成、`storeId=homeStoreId` 付き。
- `features/master-data/local-storage.ts`
  - `SEED_RESET_TOKENS` を更新（古いlocalStorageを強制再シード）:
    - `luxas-master-staff`: `2026-06-20-staff-pm7stores`
    - `luxas-master-shifts-v2`: `2026-06-20-shifts-pm7stores`
- `features/master-data/staff-manager.tsx`（スタッフ管理画面 `/dashboard/staff`）
  - 詳細フォームを **PM錦糸町の項目に拡張**: 社員番号/姓/名/フリガナ(セイ・メイ)/ニックネーム/性別/電話/Email/個人指名・男女指名/個人指名料/フリーメッセージ。
  - **一覧を現在店舗で絞り込み**（`isStaffHomeStore`）。上部バーの店舗切替で店舗別に表示。新規作成時は現在店舗を初期所属にプリセット。
  - 一覧の「ニックネーム」列は `nickname ?? displayName` を表示。
  - **対応コース欄はコースマスタ（services）から動的生成**（ハードコードしない）。**縦3列**表示（`sm:grid-cols-2 xl:grid-cols-3`）。
  - レイアウト: 左一覧を縦長スクロール・右明細を広く。
- `components/master/master-split-panel.tsx`（共通UI）
  - 任意props追加: `gridClassName`（列比上書き）・`listMaxHeightClassName`（左一覧を縦スクロール）。他のマスタ画面はデフォルトのままで影響なし。スタッフ画面は `lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]` ＋ `max-h-[72vh]` を渡している。

### ユーザー確認OK済み
- 店舗別にスタッフが分かれて表示される。
- コースのチェック欄が3列になっている。

---

## 3. 次にやること（優先順）

1. **商品（コース）の取り込み** ＝ ②本番。PMの「商品情報（コース）」を各店舗ぶん取得し、`initialServices`（`features/master-data/mock-data.ts`、`servicesStorageKey="luxas-master-services"`）を実データ化。
   - PMのコース構成（錦糸町スタッフ詳細の下段で確認済みの分類例）: 大好評!《肩甲骨リセット》／超回復コース(脳リフレ15分込み)／寄附金付きコース／"ボディケア"／頭ほぐし30分／マタニティコース／Menu for foreign tourists／ClassPass 等。カテゴリ色分け（`MenuCategory`・`categoriesStorageKey`）も検討。
   - 非表示コースは入れない。価格・時間・カテゴリ・男女可否・個室要否などPMに合わせる。
   - シードを変えたら `SEED_RESET_TOKENS["luxas-master-services"]` にトークン追加で再シードがかかる。
   - 取り込み後、スタッフの「対応コース」をPMの各人チェック状態に合わせて紐付ける（今は全コース対応の空配列）。
2. 余力があれば PMエリア（東京/神奈川/五反田）をアプリ org に反映。

---

## 4. 既知の注意点（ハマりどころ）

- **`useLocalCollection` には安定参照（module定数の `initial*` か `EMPTY_*`）を渡す。** インライン `[]`/`{}` は無限ループ（Maximum update depth）。
- **dev サーバ稼働中に `npm run build` をしない**（`.next` 破損）。型確認は `npx tsc --noEmit`。
- **シード再シードはトークン方式。** データ構造を変えたら `SEED_RESET_TOKENS` のトークン文字列を更新しないと古いlocalStorageが残る。
- 予約mockが参照するstaff idは `staff-001`/`staff-002` のみ（渋谷先頭2名に割当済み）。スタッフidを変える時は予約参照を壊さない。
- `docs/reference/`（PM生データ・スクショ由来メモ）と `.claude/settings.local.json` はコミット対象外（従来どおり）。
- dev サーバ: `npm run dev`（ポート3001）。プレビューMCP serverId は起動ごとに変わるので、実機確認は `open "http://localhost:3001/..."` を使う。

---

## 5. 参照
- PM設計正本: `~/Desktop/pm_スクリーンショット/LUXAS_docs/`（pm-screen-structure-reference.md, luxas-build-spec-from-pm.md 等）
- PMスタッフ生データ: `docs/reference/pm-staff-import.md`
- 実行ポリシー/キュー（現在は未使用だが残置）: `docs/instructions/_execution-policy.md`, `_index.md`
