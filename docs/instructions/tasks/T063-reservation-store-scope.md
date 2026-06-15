# タスクID：T063
# タスク名：予約データに storeId を付与し、現在店舗でscope（非破壊・既存データは消さない）

## 安全レベル
CAUTION（予約まわりの読み取りに店舗フィルタを追加。データ削除・一括書換は禁止）

## 目的
T062で導入した「現在店舗（currentStoreId）」に基づき、**予約データ**を店舗ごとに分離する第一歩。新規予約には storeId を付け、各画面は現在店舗のデータだけ表示する。**既存の予約データは消さない・一括変更しない**。

## 依存
- T061（features/org/）・T062（use-current-store / 店舗切替）が実装済みであること。未実装なら停止。

## 非破壊の絶対ルール（最重要）
- Reservation 型の storeId は **任意（optional）**。既存予約（storeId 無し）はそのまま有効。
- 既存データへ storeId を**一括付与しない**（マイグレーション・再シードでの全書換は禁止）。
- **データが画面から消えてはいけない**。下記「安全フィルタ」を必ず使う。

## 安全フィルタ（必ずこの規則で絞る）
現在店舗 = currentStoreId、既定店舗 = "store-shibuya"（T061）とする。予約 r が現在店舗に表示される条件:
- `r.storeId === currentStoreId` （その店舗のデータ）
- **または** `(!r.storeId) && currentStoreId === "store-shibuya"` （storeId未設定の既存データは既定店舗でのみ表示）
→ これにより、既定店舗(渋谷)では従来どおり全既存データが見え、他店舗では新規に作った分だけが見える（既存が消えない）。

## 対象ファイル / 変更してよい
- features/reservations/types.ts（Reservation に `storeId?: string` 追加）
- features/reservations/reservation-ledger.tsx（作成時に storeId=現在店舗を付与＋表示を安全フィルタで絞る）
- features/reservations/reservation-create-page.tsx（作成時に storeId 付与）
- features/reservations/reservation-list.tsx / booking-returns.tsx（一覧を安全フィルタで絞る）
- 支払・レジ（T049の画面）・経営指標で予約を読む箇所（安全フィルタで絞る）
- 共通ヘルパ追加可: features/org/ か features/reservations/ に `filterReservationsByStore(list, currentStoreId)`

## 変更してはいけないファイル
- 顧客・スタッフ・メニュー・ブース等のマスタ（このタスクではscopeしない＝共有のまま。別タスクT064で検討）。
- 会計の保存構造の破壊変更。

## 実行内容
1. Reservation に `storeId?: string` を追加（任意）。
2. 予約作成（台帳インライン＋専用画面）で、保存時に `storeId = currentStoreId` を入れる。
3. 予約を読む各画面（台帳/予約一覧/返客/支払レジ/経営指標の予約集計）に**安全フィルタ**を適用。
4. 店舗を切り替えると、台帳・一覧などが現在店舗の予約だけになる（渋谷では既存も見える）。
5. 1画面ずつ適用・検証し、データが消えないことを必ず確認。

## 検証
- npm run lint / npm run build 成功。
- 実機:
  - 既定店舗(渋谷)で従来の予約が**すべて見える**（消えない）。
  - 店舗を別店舗に切替→台帳/一覧が（新規未作成なら）空になり、渋谷に戻すと元通り。
  - 別店舗で新規予約を作成→その店舗でだけ表示され、渋谷には出ない。
  - 会計・返客・予約一覧・経営指標も現在店舗基準で整合。

## 完了条件
1. storeId 付与＋安全フィルタ適用。2. 既存データが消えない（渋谷で全件表示）。3. lint/build OK。4. _index更新＋sessions追記。5. 実機OKで完了。

## 停止条件
- 既存データが画面から消える挙動になったら即停止して報告。
- 顧客/マスタのscopeが必要に見えたら停止（T064）。会計構造の変更が要るなら停止。
- T061/T062未実装なら停止。

## 報告
- 完了ID T063 / 変更ファイル / lint・build / 「渋谷で既存全件表示・他店舗は新規のみ」の確認 / 実機確認依頼。

## 補足（次段階・このタスクではやらない）
- T064: 顧客・スタッフ・メニュー等マスタの店舗/テナントscope（共有か店舗別かを設計）。
- Supabase移行時に storeId を正式キー化＋RLSでテナント/店舗分離。
