# タスクID：T031
# タスク名：営業時間設定を予約台帳にランタイム連動（定数参照をやめる）

## 安全レベル
CAUTION（台帳の時間軸ロジック変更）

## 目的
T014で作った営業時間設定画面の保存値を、予約台帳タイムラインが実際に反映するようにする。現状、台帳は `initialStoreSettings` 定数を参照しており、設定を変えても効かない。

## 背景
店舗設定はlocalStorageに保存される(T002/T014)が、ledgerは定数を読む実装。営業開始/終了/slotMinutesを設定値で動かす。

## 対象ファイル / 変更してよいファイル
- `features/reservations/reservation-ledger.tsx`（businessStart/End/slotMinutesを店舗設定localStorageから読む）
- 必要なら店舗設定の読み出しヘルパ（T002で作ったもの）

## 変更してはいけないファイル
- `features/reservations/reservation-create-page.tsx`（同様の修正が要る場合は別途。今回はledger優先。触るなら最小）
- `features/customers/` `features/import-export/` `features/master-data/`の無関係箇所
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. ledger の `businessStart`/`businessEnd`/`slotMinutes` を、店舗設定のlocalStorage値（useLocalCollection or 読み出しヘルパ）から取得するように変更。未設定時は初期値にフォールバック。
2. 設定画面で営業時間を変更→台帳タイムラインの範囲・基本/全体が追従することを確認。
3. ドラッグ/配置/シフト色分けが新しい時間軸でも壊れない。

## 検証方法
- `npm run lint` / `npm run build`／実機（設定変更→台帳反映）でユーザー確認。

## 完了条件
1. 営業時間設定が台帳に反映される。2. 既存挙動を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 店舗設定の読み出し方式で迷えば推奨で進め報告。create-pageまで波及して大きくなるなら一旦ledgerのみで止めて報告。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/変更箇所/フォールバック/lint・build/_index更新/実機確認依頼
