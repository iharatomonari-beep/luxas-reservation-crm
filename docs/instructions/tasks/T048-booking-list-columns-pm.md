# タスクID：T048
# タスク名：予約一覧をPMの列・上部操作に合わせる

## 安全レベル
CAUTION（reservation-list.tsx の列・上部の拡張）

## 目的
PMの予約一覧（予約ヘッダ情報）の列・上部に合わせる。

## PMの仕様
- 上部: 日付picker + 検索 + 検索条件追加 + 総販売額表示
- 列: ID / 予約日 / 予約開始時間 / 顧客 / 顧客性別 / リピート(回数) / スタッフ / コース名 / 売上価格 / 会計状況 / 施術コメント / 予約経路 / キャンセル日時

## 対象ファイル
- features/reservations/reservation-list.tsx
- 参照: features/reservations/types.ts, 会計(saleAmount/paymentStatus), customers(性別/リピート), 予約タグ(予約経路)

## 実行内容
- 列を上記PM順に揃える。実データがあるものは実値化:
  - ID / 予約日 / 開始 / 顧客 / 担当 / コース / 売上価格(saleAmount or 見込) / 会計状況(paymentStatus) / 施術コメント(memo) / キャンセル日時(canceledAt)。
  - 顧客性別・リピート回数: 顧客マスタ(customers)と電話/氏名照合で取得できれば実値、無ければ「-」。
  - 予約経路: 予約ルートタグ(bookingTagIds)から表示、無ければ「-」。
- 上部に「総販売額」表示と「検索条件追加」ボタン（最低限のUI。条件追加は段階的でも可）。
- 行クリックで台帳遷移は維持。

## 変更してはいけないファイル
- customers/import等の破壊変更はしない（参照のみ）。

## 検証
- npm run lint / npm run build 成功。実機: 列がPM順、売上/会計/キャンセル日時が実値、総販売額表示。

## 完了条件
1. 列・上部がPM準拠。2. 実データは実値・無いものは「-」。3. lint/build OK。4. _index更新＋sessions追記。5. 実機OKで完了。

## 停止条件
- 型追加が必要なら推奨で進め報告。customers破壊はSTOP。lint/build失敗で直せなければ停止。

## 報告
- 完了ID T048 / 変更ファイル / lint・build / 実機確認依頼。
