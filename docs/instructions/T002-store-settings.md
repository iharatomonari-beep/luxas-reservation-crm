# T002: 店舗設定マスタの導入（設定値ファイル＋型。設定画面は後回し）

## 目的
予約台帳の営業時間などのハードコード（`businessStart="10:00"` / `businessEnd="23:00"` / `slotMinutes=5`）を「店舗設定」という1か所のマスタに集約し、台帳と予約作成がそこを参照するようにする。**今回は設定画面（UI）は作らない。** 型・初期値・参照差し替えまで。
参考: `docs/luxas-reservation-ledger-spec.md`（§4,5）、`docs/luxas-master-data-redesign.md`（§2「店舗設定」）。

## 変更対象ファイル
- 新規追加: `features/master-data/` 配下に店舗設定の型・初期値・読み出しヘルパ（既存マスタの流儀に合わせる。例: `store-settings.ts` など）
- 変更: `features/reservations/reservation-ledger.tsx`（`businessStart` / `businessEnd` / `slotMinutes` の参照差し替え）
- 変更: `features/reservations/reservation-create-page.tsx`（営業時間・予約単位を参照している箇所があれば差し替え）

## 実行内容
1. 型 `StoreSettings` を定義する:
   - `businessStartTime: string`（"HH:mm"。初期値 `"10:00"`）
   - `businessEndTime: string`（初期値 `"23:00"`）
   - `reservationAcceptStartTime: string`（初期値 `"10:00"`）
   - `reservationAcceptEndTime: string`（初期値 `"22:00"`。仕様に確定値が無いのでコメントで「要確認」と明記）
   - `slotMinutes: number`（初期値 `5`）
2. 既存マスタと同様に localStorage キー（例 `luxas-store-settings`）＋初期値 `initialStoreSettings` を用意する。
3. 単一オブジェクトの保持方式は既存コードに合わせて素直に実装する（配列前提の `useLocalCollection` を無理に流用しない）。**採用した保持方式と理由を報告する。**
4. 台帳・作成ページのハードコード値を店舗設定参照に置き換える。
5. **初期値は現行と同じ値にし、見た目・挙動が変わらないこと**（回帰させない）。`slotMinutes` を変えればグリッドが変わる拡張余地ができていればよい。

## 変更してはいけないファイル
- `features/customers/`（顧客管理）
- `features/import-export/`（CSV入出力）
- `features/master-data/` の既存マネージャ（`staff-manager.tsx` / `service-manager.tsx` / `room-manager.tsx` / `shift-manager.tsx`）のロジック
- `lib/supabase/`、`app/` 配下のレイアウト・認証
- 上記「変更対象ファイル」以外

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）
- 初期値が現行（10:00 / 23:00 / 5分）と一致し、台帳の表示が変わらないことをコード上で説明

## 完了条件
1. `StoreSettings` 型・初期値・読み出しヘルパが追加された。
2. 台帳・作成ページのハードコードが店舗設定参照に置き換わった。
3. lint / build が通った。
4. `docs/sessions/YYYY-MM-DD.md` に追記し、`_index.md` の T002 を「完了」に更新した。

## 停止条件
- 単一オブジェクトの保持方式に迷い、既存流儀から判断できない場合は停止して確認を求める。
- lint / build が通らず自力修正できない場合は停止。
- 設定画面（UI）まで作らないと参照差し替えができない、等スコープ逸脱が必要になったら停止して報告。

## 実行後の報告内容
- 追加ファイルと、店舗設定の保持方式（どう単一オブジェクトを持ったか）と理由
- ハードコード `"10:00"` / `"23:00"` / `slotMinutes=5` を置き換えた該当箇所
- 初期値が現行挙動を変えないことの説明
- lint / build の結果
