# タスクID：T023
# タスク名：月間シフト入力（カレンダーグリッド＋日次予算/目標）

## 安全レベル
CAUTION（シフト/目標のUI追加）

## 目的
PMの「月間シフト作成/目標設定」相当の月間グリッドを追加。行=日付、列=日次予算(目標)/目標コメント/スタッフ各列(出勤チェック＋時間)。前月/翌月切替。

## 背景
LUXASは曜日別パターン編集(T015)済み。月間グリッドは「日別の目標入力＋シフト微調整」用途。catalog §「月間シフト入力」。

## 対象ファイル / 変更してよいファイル
- 新規: `app/dashboard/shifts/monthly/page.tsx`
- 新規: `features/master-data/monthly-shift-grid.tsx`
- 参照/利用: `features/master-data/mock-data.ts`(initialShifts/staff)、月間目標は localStorage（新キー可）

## 変更してはいけないファイル
- `features/reservations/`、既存の shift-manager.tsx のロジック（流用は可・破壊不可）
- `lib/supabase/` `supabase/` `.env*` `package.json` `tailwind.config.ts`、上記以外

## 実行内容
1. 月間グリッド画面を追加。行=日付（当月）、列=日次予算(目標)入力/目標コメント/スタッフ列(チェック＋勤務時間)。
2. 前月/翌月切替、保存（シフトはshiftsへ、目標は別キー）。
3. 既存の曜日別パターン(T015)で生成したシフトをグリッドに反映・微調整できる。
4. サイドバー or シフト画面からの導線追加（sidebar.tsx 変更可）。

## 検証方法
- `npm run lint` / `npm run build`／実機でユーザー確認。

## 完了条件
1. 月間グリッドで出勤チェック・時間・日次目標を編集保存できる。2. 既存シフトと矛盾しない。3. lint/build OK。4. sessions追記・_index更新。5. 実機OKで完了。

## 停止条件
- 目標データの保持先(新キー)や既存シフトとの統合方針で迷えば推奨で進め報告（停止不要）。型/保存形式の大きな変更は確認。指定外ファイルはSTOP。lint/build失敗で停止。

## 完了後の報告内容
- 完了ID/追加画面/データ保持方式/lint・build/_index更新/実機確認依頼
