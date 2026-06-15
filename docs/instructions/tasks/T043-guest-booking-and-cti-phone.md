# タスクID：T043
# タスク名：新規予約をゲストで登録可能に（顧客名・電話を任意化）＋CTI着信番号の自動入力（URLパラメータ方式）

## 安全レベル
CAUTION（予約作成のバリデーション/初期値変更。3ファイルにまたがる。データ削除なし）

## 目的
電話を受けながら素早く予約を取れるようにする。
1. **顧客名・電話番号を必須から外す**。開いた時点で顧客名は既定「ゲスト」（編集可）。空のまま保存しても「ゲスト」で登録される。
2. **CTI（アロハND5／アロハCTIエンジン）の着信番号を、新規予約画面の電話番号欄に自動入力**できるようにする。方式は **URLパラメータ**（アロハCTIエンジンは「着信時に番号を埋め込んだURLをブラウザで開く」連携に対応）。

## 背景（現状）
- 予約作成フォームは2か所にあり、どちらも顧客名・電話番号が必須:
  - 専用画面: `features/reservations/reservation-create-page.tsx`（ルート `app/dashboard/reservations/new/page.tsx`）
  - 台帳インライン作成フォーム: `features/reservations/reservation-ledger.tsx`（「新規予約」ボタン／空き枠クリックで開く）
- 専用画面のルートは既に searchParams（staffId/roomId/date/startTime/serviceMenuId）を読んで prefill する作りがある。ここに電話番号(tel)を足すのが最小実装。
- 台帳インラインフォームはアプリ内で開くため URL パラメータは効かない。**CTI連携の入口は専用画面 `/dashboard/reservations/new` を使う**。

## 対象ファイル / 変更してよいファイル
- `app/dashboard/reservations/new/page.tsx`
- `features/reservations/reservation-create-page.tsx`
- `features/reservations/reservation-ledger.tsx`

## 変更してはいけないファイル
- 上記以外すべて（`features/customers/` `features/import-export/` `lib/` `.env*` `package.json` `tailwind.config.ts` など）
- 既存のお客様予約データ・localStorageキーの破壊変更はしない（型へのフィールド追加は不要・既存Reservationのまま）。

## 実行内容

### A. ゲスト登録（顧客名・電話を任意化）— 両フォーム共通の方針
- 「顧客名」「電話番号」の入力欄から **必須（required）を外す**。
- 作成フォームの **バリデーションから顧客名・電話番号の必須チェックを削除**する。
- フォーム初期化時、**顧客名の既定値を「ゲスト」**にする（prefillに顧客名があればそれを優先）。電話番号の既定は空（prefillにあればその値）。
- 保存時、**顧客名が空文字なら "ゲスト" を補完**して登録する（電話番号は空のままでOK）。
- 他の必須（メニュー・担当・日付・時刻・5分単位・シフト/重複チェック等）は**そのまま維持**する。

#### A-1. 専用画面 `reservation-create-page.tsx`
- `<FormInput label="顧客名" … required />` と `<FormInput label="電話番号" … required />` の `required` を外す。
- `validateReservationForm` 内の以下2ブロックを削除する:
  - `if (isBlank(value.customerName)) { return "顧客名を入力してください。…"; }`
  - `if (isBlank(value.phone)) { return "電話番号を入力してください。…"; }`
- `createInitialForm` の `customerName: ""` を、`customerName: <prefillの顧客名> || "ゲスト"` に変更（prefill対応はBで追加）。`phone` は prefillの電話 `|| ""`。
- 予約オブジェクトを組み立てる箇所（`customerName: normalizeText(form.customerName)` の行）で、結果が空なら `"ゲスト"` にする（例: `normalizeText(form.customerName) || "ゲスト"`）。

#### A-2. 台帳インライン `reservation-ledger.tsx`
- 作成フォームの `<FormInput label="顧客名" … required />` `<FormInput label="電話番号" … required />` の `required` を外す。
- 作成フォーム用バリデーションの顧客名・電話番号の必須チェック（`"顧客名を入力してください。…"` / `"電話番号を入力してください。…"` を返す2ブロック）を削除する。
- 作成フォームの初期化（新規作成時の prefill から作るフォーム）で `customerName` の既定を `"ゲスト"`（prefillに顧客名があればそれ）にする。編集時（既存予約からフォームを作る）は**従来どおり**（既存の顧客名をそのまま）。
- 予約オブジェクト組み立て箇所（`customerName: normalizeText(form.customerName)`）で、空なら `"ゲスト"` を補完。

> 補足: 顧客の注意事項マッチング（matchedCustomer）は電話番号優先で動く既存ロジックのまま。顧客名が "ゲスト" でも実害はないが、可能なら「顧客名が "ゲスト" かつ電話空のときは名前一致検索をスキップ」にすると誤マッチを防げる（任意・できる範囲で）。

### B. CTI着信番号の自動入力（URLパラメータ方式）— 専用画面のみ
#### B-1. ルート `app/dashboard/reservations/new/page.tsx`
- `searchParams` から電話番号を読む。キー名は **`tel` を主とし、無ければ `phone`** も見る（`firstValue(resolvedSearchParams.tel) || firstValue(resolvedSearchParams.phone)`）。
- 顧客名も任意で読む（`name`）。
- `initialPrefill` に `customerName` と `phone` を追加して渡す。
- 電話番号は最低限 `trim()`。全角数字が来る場合に備え半角化できればなお良い（任意）。ハイフン有無はそのまま通してよい。

#### B-2. `reservation-create-page.tsx` の prefill 型と初期化
- `ReservationCreatePrefill` と `NormalizedReservationCreatePrefill` に `customerName?: string` / `phone?: string`（Normalized側は `string`）を追加。
- `normalizeReservationCreatePrefill` に `customerName` / `phone` を追加（`optionalPrefillValue` で取り出し、trim）。
- `createInitialForm` で `phone = prefill.phone || ""`、`customerName = prefill.customerName || "ゲスト"` を使う（Aと整合）。
- 着信URLで開いたとき、電話番号欄に番号が入った状態で表示されること。

## 検証方法
- `npm run lint`（エラー0）／`npm run build`（型エラー0・成功）
- 実機（`npm run dev`）:
  1. 台帳「新規予約」→ 顧客名が「ゲスト」既定・必須バッジなし。顧客名/電話を空（ゲストのまま）でもメニュー・担当・時刻が正しければ**登録できる**。
  2. 専用画面 `/dashboard/reservations/new` も同様にゲストで登録できる。
  3. `/dashboard/reservations/new?tel=09012345678` を開くと、**電話番号欄に 09012345678 が入っている**。
  4. `/dashboard/reservations/new?tel=09012345678&name=山田` で顧客名「山田」・電話入りになる。
  5. 既存の予約編集・他の必須チェック（メニュー/担当/時刻/シフト/重複）は従来どおり。

## 完了条件
1. 両フォームでゲスト登録可（顧客名・電話が任意、既定「ゲスト」、空保存で「ゲスト」）。2. 専用画面で `?tel=` の番号が電話欄に自動入力される。3. 既存機能を壊さない。4. lint/build OK。5. `_index.md` 更新＋`docs/sessions/` 追記。6. 実機OKで「完了」。

## 停止条件
- 型整合が崩れて build が通らず範囲内で直せない場合は停止して報告。
- 指定外ファイルの変更が必要になったら STOP。
- Reservation 型へのフィールド追加が必要に見えたら止めて確認（本タスクは不要のはず）。

## 完了後の報告内容
- 完了ID T043 / 変更ファイル（上記3つ）/ lint・build結果 / ゲスト登録と `?tel=` 自動入力が動いたこと / 実機確認依頼。
- 補足として「CTI側の設定（アロハCTIエンジンの開くURLを `/dashboard/reservations/new?tel=<番号差込>` にする）が必要」である旨を一言。
