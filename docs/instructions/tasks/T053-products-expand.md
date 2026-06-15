# タスクID：T053
# タスク名：商品情報の拡充（セット商品／物販カテゴリ／EPARK掲載／オンライン予約フラグ）

## 安全レベル
CAUTION（マスタ追加・既存マスタへの列追加。1項目ずつ）

## 目的
PMの商品情報グループに合わせ、不足を埋める。

## PMの仕様
- 通常商品/オプション/セット: ID/カテゴリ/名前/施術料金(税込)/表示順/オンライン予約(○×)。
- 物販カテゴリ: ID/名前/省略名/表示順（既定: ポイント使用/チケット販売/チケット利用/プリペイド販売/プリペイド利用/物販/ClassPass/ウエルカムチケット）。
- 物販商品: ID/管理コード/物販名/表示順。
- EPARK掲載設定: おすすめコース1/おすすめコース2 ドロップダウン＋保存。

## 対象（この順で1つずつ）
1. メニュー(service-manager)・オプション(option-manager)に「オンライン予約(○×)」フラグ列＋編集追加。
2. セット商品マスタ 新規（/dashboard/course-sets 等）: カテゴリ/名前/料金/表示順/オンライン予約。
3. 物販カテゴリ マスタ 新規（/dashboard/retail-categories）: 名前/省略名/表示順＋既定カテゴリ。
4. EPARK掲載設定 新規（/dashboard/epark）: おすすめコース1/2 選択＋保存。

## 対象ファイル
- features/master-data/service-manager.tsx, option-manager.tsx（フラグ追加）
- 新規: app/dashboard/course-sets/page.tsx, retail-categories/page.tsx, epark/page.tsx ＋各コンポーネント
- components/layout/top-menu.tsx（商品情報グループに項目追加）

## 実行内容
- 各項目を1つずつ追加。型追加は最小（ServiceMenu に onlineBooking?:boolean など）。初期データ・CRUD・メニュー導線。
- 物販カテゴリは既定カテゴリをseed（再シードは慎重に・既存物販を壊さない）。

## 変更してはいけないファイル
- 既存の予約/会計/顧客データ破壊。

## 検証
- 各: npm run lint / npm run build 成功。実機で各画面が動く＋メニュー導線。

## 完了条件
1. 4項目反映。2. 既存維持。3. lint/build OK。4. _index更新＋sessions追記。5. 実機OKで完了。

## 停止条件
- 再シードで既存物販が壊れる懸念があれば停止して報告。依存追加はSTOP。

## 報告
- 各項目ごとに 変更/追加ファイル / lint・build / 実機確認依頼。
