# LUXAS Master Data Redesign

この文書は、PeakManager の業務構造を参考にして、LUXAS のマスタを localStorage 版と Supabase 版の両方で揃えやすくするための再設計案です。

## 1. 設計方針

- 業務ルールは UI ではなくマスタに持つ
- localStorage 版は単一店舗の検証を優先する
- Supabase 版は正規化と参照整合性を優先する
- 画面表示用の名前と業務上の ID を分ける
- 将来の分析用に、予約・来店・売上を分けて扱う

## 2. 店舗設定

必要フィールド:

- `id`
- `storeName`
- `timezone`
- `businessStartTime`
- `businessEndTime`
- `reservationAcceptStartTime`
- `reservationAcceptEndTime`
- `reservationSlotMinutes`
- `defaultTimelineStartTime`
- `defaultTimelineEndTime`
- `isActive`

意図:

- 営業時間と予約受付時間を分ける
- タイムラインの起点を店舗設定から決める
- 5分単位や今後の単位変更に対応する

## 3. 営業時間

必要フィールド:

- `storeId`
- `dayOfWeek`
- `openTime`
- `closeTime`
- `acceptStartTime`
- `acceptEndTime`
- `isClosed`

意図:

- 日次で営業時間が変わる店舗に対応する
- 予約受付締切を別に持てるようにする

## 4. 予約受付時間

必要フィールド:

- `storeId`
- `leadMinutes`
- `cutoffMode`
- `cutoffTime`
- `minimumNoticeMinutes`

意図:

- 当日受付の境界を明示する
- 予約台帳の空き枠生成と予約可否判定に使う

## 5. 時間表示単位

必要フィールド:

- `storeId`
- `slotMinutes`
- `displayMinutes`
- `snapMinutes`

意図:

- 5分単位表示を保持する
- 将来 10 分単位や 15 分単位に変えられるようにする

## 6. スタッフマスタ

必要フィールド:

- `id`
- `code`
- `fullName`
- `displayName`
- `role`
- `sortOrder`
- `isActive`
- `defaultStoreId`
- `note`

意図:

- 表示名と業務名を分ける
- 予約台帳の並び順を固定する
- localStorage と Supabase の両方で同じ主キーを使う

## 7. スタッフ表示順

必要フィールド:

- `staffId`
- `sortOrder`
- `pinnedOnLedger`

意図:

- 予約台帳の横並び順を制御する
- シフトがない日でも意図的に見せるかどうかを分ける

## 8. シフト

必要フィールド:

- `id`
- `storeId`
- `staffId`
- `workDate`
- `startTime`
- `endTime`
- `breakStartTime`
- `breakEndTime`
- `isActive`
- `memo`

意図:

- 予約台帳の表示対象スタッフを決める
- 予約可否判定と重複チェックの前提にする

## 9. シフトパターン

必要フィールド:

- `id`
- `storeId`
- `name`
- `dayOfWeek`
- `startTime`
- `endTime`
- `breakStartTime`
- `breakEndTime`
- `isActive`

意図:

- 日次シフトの複製を簡単にする
- PeakManager 的な日々の運用を手入力から少しだけ外す

## 10. ブースマスタ

必要フィールド:

- `id`
- `code`
- `name`
- `kind`
- `sortOrder`
- `isActive`
- `memo`

意図:

- 予約の重複対象を staff と room で分ける
- 施術ブースと個室を共通の型で扱う

## 11. メニューマスタ

必要フィールド:

- `id`
- `code`
- `name`
- `durationMinutes`
- `price`
- `sortOrder`
- `category`
- `isActive`
- `memo`

意図:

- 予約作成時の終了時刻自動補完に使う
- 価格と所要時間を同じマスタで管理する

## 12. メニュー別利用可能ブース

必要フィールド:

- `menuId`
- `roomId`
- `isActive`

意図:

- 予約作成時に対応ブースだけを出す
- 予約可否判定のブース制約を明示する

## 13. スタッフ別対応メニュー

必要フィールド:

- `staffId`
- `menuId`
- `isActive`

意図:

- 予約作成時に対応外メニューを落とす
- スタッフ教育や兼務ルールを保存する

## 14. 顧客タグ

必要フィールド:

- `id`
- `name`
- `colorKey`
- `isActive`

意図:

- 顧客検索の補助条件にする
- 予約作成時の注意表示に使う

## 15. 予約ルートタグ

必要フィールド:

- `id`
- `name`
- `isActive`

意図:

- 電話、来店、紹介などの流入経路を記録する
- 将来の分析で活用する

## 16. 施術カルテタグ

必要フィールド:

- `id`
- `name`
- `isActive`

意図:

- 顧客詳細で注意事項やカルテメモを分類する
- 予約時の申し送りに活かす

## 17. localStorage 版の型設計

- 配列で保持する
- 参照整合性は保存時に確認する
- 表示名はフロントで解決する
- 日付と時刻は `YYYY-MM-DD` と `HH:mm` に統一する
- マスタは各画面で共通の storage key を使う

推奨する基本型:

- `StoreSettings`
- `BusinessHours`
- `ReservationPolicy`
- `StaffMember`
- `StaffShift`
- `ShiftPattern`
- `ServiceRoom`
- `ServiceMenu`
- `CustomerTag`
- `ReservationRouteTag`
- `ChartTag`

## 18. Supabase 版の型設計

- 主テーブルと中間テーブルを分ける
- 文字列の表示名は必要最小限にする
- foreign key を持つ
- `store_id` を必ず持つ
- RLS を前提にする

推奨する基本テーブル:

- `store_settings`
- `business_hours`
- `reservation_policies`
- `staff_members`
- `staff_shifts`
- `shift_patterns`
- `service_rooms`
- `service_menus`
- `menu_room_relations`
- `staff_menu_relations`
- `customer_tags`
- `reservation_route_tags`
- `chart_tags`

## 19. 画面との対応

- 店舗設定 -> 店舗情報
- 営業時間 -> 店舗情報
- スタッフマスタ -> スタッフ管理
- シフト -> シフト管理
- ブースマスタ -> ブース管理
- メニューマスタ -> メニュー管理
- 顧客タグ -> 顧客詳細と検索
- 予約ルートタグ -> 予約作成と日次管理
- 施術カルテタグ -> 顧客詳細

## 20. 実装順

P0

- 店舗設定
- 営業時間
- 予約受付時間
- 時間表示単位
- スタッフマスタ
- ブースマスタ
- メニューマスタ

P1

- シフト
- シフトパターン
- スタッフ別対応メニュー
- メニュー別利用可能ブース
- 顧客タグ
- 予約ルートタグ

P2

- 施術カルテタグ
- 売上や来店実績の集計用拡張
- Supabase 版の参照整合性強化

