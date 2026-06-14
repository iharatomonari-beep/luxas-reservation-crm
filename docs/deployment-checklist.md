# デプロイチェックリスト

## 事前確認

- `npm run lint` が通る。
- `npm run build` が通る。
- 主要画面がローカルで表示できる。

## 環境変数

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase

- Auth のリダイレクトURLが本番URLに設定されている。
- 匿名アクセスが必要な画面はない。
- 本接続は v0.1 の範囲外であることを再確認する。

## Vercel

- プロジェクトに環境変数を設定する。
- Preview と Production のURLを確認する。
- デプロイ後に `/login` から `/dashboard` へ移動できることを確認する。

## 手動確認

- `/dashboard/reservations` が表示できる。
- `/dashboard/customers` が表示できる。
- `/dashboard/import-export` が表示できる。
- CSV のダウンロードがブラウザ側で動く。

## ロールバック前提

- localStorage ベースの挙動は壊さない。
- README の起動手順を更新した状態でデプロイする。
