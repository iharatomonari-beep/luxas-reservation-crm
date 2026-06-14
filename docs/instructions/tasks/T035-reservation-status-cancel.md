# タスクID：T035
# タスク名：予約ステータス・キャンセル管理（会計状況/取消/無断キャンセル理由）

## 安全レベル
CAUTION（Reservation型・予約詳細ロジック）

## 目的
PMの予約詳細にある状態管理を整える。会計状況(未会計/会計済=T022)に加え、キャンセル種別（通常キャンセル/無断キャンセル/取消）と理由を扱えるようにする。

## 背景
catalog: 予約一覧に「キャンセル日時」、集計バーに「取消/無断キャンセル/返客」。LUXASは status=booked/completed/canceled のみ。理由・無断区分が無い。

## 対象ファイル / 変更してよいファイル
- `features/reservations/types.ts`（status拡張 or cancel関連フィールド追加）
- `features/reservations/reservation-ledger.tsx`（詳細でステータス変更・キャンセル理由入力）

## 変更してはいけないファイル
- `features/customers/` `features/import-export/` `features/master-data/`
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. キャンセル種別を追加（推奨）: `cancelType?: "none"|"cancel"|"no_show"|"void"`（通常/無断/取消）＋`cancelReason?: string`＋`canceledAt?: string`。
2. 予約詳細でステータス変更（予約中/完了/キャンセル）＋キャンセル時に種別・理由・日時を記録。
3. 予約一覧(T021)の「キャンセル日時」、集計バー(T019)の「取消/無断キャンセル」を実値化。
4. 既存の canceled は cancelType="cancel" 相当として互換。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. キャンセル種別・理由を記録・表示でき、一覧/集計に反映。2. 既存を壊さない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- status拡張 vs 別フィールドの設計は推奨で進め報告。破壊的型変更はSTOP。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加フィールド/反映箇所/lint・build/_index更新/実機確認依頼
