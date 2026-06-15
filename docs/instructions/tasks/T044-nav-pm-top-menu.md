# タスクID：T044
# タスク名：ナビをPM準拠の上部メニューバー（ドロップダウン）に作り替え／左サイドバー撤去

## 安全レベル
CAUTION（全ページ共通レイアウトの変更。ナビゲーションのみ・データ操作なし）

## 目的
管理画面のナビゲーションを PeakManager（PM）に合わせる。
PMは画面**上部の横並びメニューバー（カテゴリのドロップダウン）**でナビゲートし、**左の常設サイドバーは持たない**（Orders画面の左にある「予約/開く/返客/会計/顧客/カード」は台帳専用のアクションレールで、これは別物・既存のまま）。
LUXASは現在26項目のフラットな左サイドバーが常時表示。これを**撤去**し、**PM風の上部ドロップダウンメニュー**に一本化する。

## 背景（現状の構造）
- `components/layout/dashboard-shell.tsx`: 左に `<Sidebar>`、右に main。ヘッダーは「LUXAS予約・顧客管理＋email＋ログアウト」のみ。
- `components/layout/sidebar.tsx`: 26項目フラットな左サイドバー（`navigationItems` 配列にルート定義あり＝ルート対応の参照に使える）。
- このレイアウトは `app/dashboard/layout.tsx` 経由で全 `/dashboard/*` ページに適用される。

## 対象ファイル / 変更してよいファイル
- `components/layout/dashboard-shell.tsx`（Sidebar をやめ、上部メニューを組み込む）
- `components/layout/top-menu.tsx`（**新規作成**＝PM風の上部ドロップダウンメニュー）
- 必要なら `components/layout/sidebar.tsx` は**残置（削除しない）**。import を外して未使用にするだけ。

## 変更してはいけないファイル
- `features/**`（予約台帳の左アクションレールには触れない）、`app/**` のページ本体、`lib/`、`.env*`、`package.json`、`tailwind.config.ts`。
- `sidebar.tsx` の**ファイル削除はしない**（STOP対象）。未使用にするだけ。

## 実行内容

### 1. 上部メニュー `components/layout/top-menu.tsx`（新規・client component）
PM風の横並びメニューバー。各カテゴリは**ドロップダウン**（クリックで開閉。外側クリックで閉じる）。現在ルートに該当する項目・カテゴリはアクティブ表示。
構成（既存ルートに割り当て済み。表記はPM準拠）:

- **トップ**（単独リンク）→ `/dashboard`
- **予約台帳 ▾**
  - 予約台帳 → `/dashboard/reservations`
  - 予約一覧 → `/dashboard/reservations/list`
  - 返客一覧 → `/dashboard/reservations/returns`
  - 物販販売 → `/dashboard/retail`
  - シフト → `/dashboard/shifts`
  - 月間シフト → `/dashboard/shifts/monthly`
- **日次管理 ▾**
  - 日次管理 → `/dashboard/daily`
  - 経費マスタ → `/dashboard/expense-accounts`
- **店舗情報 ▾**
  - 店舗設定 → `/dashboard/settings`
  - スタッフ → `/dashboard/staff`
  - ブース → `/dashboard/rooms`
  - クレカ会社 → `/dashboard/creditcards`
  - 電子マネー → `/dashboard/emoney`
- **顧客情報 ▾**
  - 顧客管理 → `/dashboard/customers`
  - 顧客フル検索 → `/dashboard/customers/search`
  - タグ管理 → `/dashboard/tags`
  - CSV入出力 → `/dashboard/import-export`
- **商品情報 ▾**
  - メニュー → `/dashboard/services`
  - カテゴリ → `/dashboard/categories`
  - オプション → `/dashboard/options`
  - 物販商品 → `/dashboard/retail-items`
- **メール管理**（単独リンク）→ `/dashboard/mail`
- **経営指標 ▾**
  - 経営指標 → `/dashboard/analytics`
  - 詳細帳票 → `/dashboard/analytics/reports`

補足:
- `/dashboard/grid`（時間グリッド＝準備中プレースホルダ）は**メニューに載せない**（死にリンク回避）。
- 実装は素直に: グループ定義の配列（label＋items[]）を持ち、`usePathname` でアクティブ判定。各グループはボタン＋ドロップダウン（`useState` で開いているグループkeyを1つ保持、`onClick` 外側で閉じる＝`useEffect` で document click か、簡易に各リンククリックで閉じる）。
- 見た目はPM寄り（白背景・横並び・hover/activeで緑系アクセント＝既存の `luxas-green` / `luxas-mist` を流用）。新規の色やlibは追加しない。

### 2. `dashboard-shell.tsx` の改修
- `<Sidebar>` の使用をやめる（import 削除）。`flex`（左サイドバー＋main）の2カラム構造をやめ、**縦積み（上=ヘッダー＋メニュー、下=main）**にする。
- ヘッダー（`<header>`）に:
  - 左: ブランド「LUXAS」（`/dashboard` へのリンク）。
  - 中央〜左: `<TopMenu />`（PCはヘッダー内に横並び表示）。
  - 右: userEmail＋ログアウトボタン（既存のまま）。
  - プレビュー注記バー（`isPreviewMode` の amber バー）は**残す**。
- モバイル（md未満）: 横並びが入らないため、既存のハンバーガーボタンを流用し、**押すと上部メニューを縦のアコーディオン**として展開（同じグループ/リンク）。`isSidebarOpen` state は流用してよい（名前は変えなくて可）。
- `handleSignOut` 等の既存ロジックは**変更しない**。

### 3. lint 対応
- `sidebar.tsx` は残置（未使用ファイルでもlintは通る想定）。`dashboard-shell.tsx` 側の未使用 import（Sidebar / PanelLeftClose 等）でlintが落ちる場合のみ、該当 import を整理する。

## してはいけないこと
- 予約台帳内の左アクションレール（予約/開く/返客/会計/顧客/カード）には触れない。
- ルートの追加・削除・ページ本体の変更はしない（メニューの貼り替えのみ）。
- 認証・Supabase・package.json 依存には触れない。

## 検証方法
- `npm run lint`（エラー0）／`npm run build`（型エラー0・成功）
- 実機（`npm run dev`）:
  1. 全 `/dashboard/*` で**左サイドバーが無くなり**、**上部にメニューバー**が出る。
  2. 各ドロップダウン（予約台帳/日次管理/店舗情報/顧客情報/商品情報/経営指標）が開き、各リンクで正しいページに遷移する。
  3. 現在ページのカテゴリ/項目がアクティブ表示される。
  4. トップ・メール管理の単独リンクが動く。
  5. モバイル幅でハンバーガー→メニューが縦に開く。
  6. ログアウト／プレビュー注記は従来どおり。

## 完了条件
1. 左サイドバー撤去＋PM風上部ドロップダウンメニュー完成。2. 全ルートに到達できる（死にリンク無し）。3. 既存機能（ログアウト等）を壊さない。4. lint/build OK。5. `_index.md` 更新＋`docs/sessions/` 追記。6. 実機OKで「完了」。

## 停止条件
- ドロップダウンの実装で型/ビルドが通らず範囲内で直せない場合は停止して報告。
- 指定外ファイルの変更が必要になったら STOP（特に sidebar.tsx の削除は STOP）。
- ルート構造の変更が必要に見えたら止めて確認。

## 完了後の報告内容
- 完了ID T044 / 変更・新規ファイル / lint・build結果 / 左撤去＋上部メニュー化と全リンク到達の確認 / 実機確認依頼。
