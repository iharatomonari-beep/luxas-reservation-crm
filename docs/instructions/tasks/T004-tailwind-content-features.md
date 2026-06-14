# タスクID：T004
# タスク名：Tailwind content に features/ を追加（予約カードが時刻位置に並ばない不具合の根治）

## 安全レベル
CAUTION（設定ファイル変更。実行前にユーザー確認）

## 目的
予約カードがタイムラインの時刻位置に配置されず左に固まる／時刻に合わせて移動できない不具合を直す。原因は Tailwind が `features/` をスキャンしておらず、`absolute` / `relative` / `inset-*` / `z-*` 等の CSS が生成されていないこと。

## 背景
- `tailwind.config.ts` の `content` は `./app/**` / `./components/**` / `./lib/**` のみで、**`./features/**` が含まれていない**。
- 予約台帳など実UIは `features/` 配下にあり、`reservation-ledger.tsx` は `absolute`(7) / `relative`(2) / `sticky` / `inset-*` / `z-10〜z-50` を多用。これらが生成されず `position` が効かないため、カードが `position:static` で左から詰まる。
- `flex` は `app/` でも使うため生成され、時刻ヘッダーだけ正常に見える。症状（カードがヘッダー時刻とズレ・横にくっつく）と一致。
- これは 5/11 からの設定不備であり、今回のセッションの変更が原因ではない。
- 影響は台帳だけでなく、`features/customers/`（モーダルの `z-50` / `inset-0`）など他の `features/` 画面の見た目も本来の表示に戻る。

## 対象ファイル
- `tailwind.config.ts`（読む・変更する）
- 影響確認のため読むだけ: `features/reservations/reservation-ledger.tsx`、`features/customers/customer-manager.tsx`

## 変更してよいファイル
- `tailwind.config.ts`（`content` 配列に1行追加するのみ）

## 変更してはいけないファイル
- `features/` 配下のコード（クラス名・JSX は変更しない）
- `app/`、`components/`、`lib/`、`features/customers/`、`features/import-export/`
- `lib/supabase/`、`supabase/`、`.env` / `.env.local`、`package.json`
- 上記「変更してよいファイル」以外すべて

## 実行内容
1. `tailwind.config.ts` の `content` 配列に次の1行を追加する:
   `"./features/**/*.{js,ts,jsx,tsx,mdx}"`
2. それ以外は一切変更しない（リファクタ・整形・他クラスの追加禁止）。

## 検証方法
- `npm run lint`（エラー0）
- `npm run build`（型エラー0・成功）
- ビルド後、生成された CSS に `.absolute{position:absolute}` や `.relative{position:relative}` が含まれることを確認（修正が効いた証拠）。
- 実機（`npm run dev`）で次を確認:
  - 予約台帳のヘッダー「13:00」の真下に 13:00 開始の予約カードが来る（時刻目盛りと一致）。
  - カードが左に固まらず、各時刻位置に並ぶ。
  - 顧客管理・各マスタ・CSV画面のレイアウトが崩れていない（むしろ本来の表示に戻る）。
  - ドラッグ5点: 右で時刻ずれ／別行で担当変更／重複でエラー停止／保留棚で別日／リロード保持。

## 完了条件
1. `content` に `features/` の1行が追加された。
2. lint / build が通った。
3. 生成CSSに `.absolute` 等が含まれることを確認した。
4. `docs/sessions/2026-06-13.md` に原因・修正・検証結果を追記した。
5. `docs/instructions/_index.md` の T004 を「完了」に更新した。

## 停止条件
- 実行前確認（CAUTION）でユーザー許可が出るまで着手しない。
- lint / build が通らず自力修正できない場合は停止。
- `content` 追加以外の変更が必要になったら STOP（指示にないファイル変更）として停止。
- 実機確認はユーザーが行う（UIの最終判定が必要な場合はそこで停止）。

## 完了後の報告内容
- 完了したタスクID（T004）
- 変更したファイル（`tailwind.config.ts` の差分1行）
- 実行した検証（lint / build / 生成CSS確認）
- 検証結果
- `_index.md` の更新内容
- 次に進んだタスクID、または停止理由
