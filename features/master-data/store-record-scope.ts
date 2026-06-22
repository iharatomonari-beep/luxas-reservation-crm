import { currentStoreId as defaultStoreId } from "@/features/org/mock-data";

/**
 * 汎用の店舗スコープ判定（非破壊）。storeId を持つ任意レコードに使う。
 * 予約の store-scope.ts と同じ規則:
 * - record.storeId === currentStoreId       … その店舗のレコード
 * - または (!record.storeId) かつ 既定店舗   … storeId未設定の既存データは既定店舗(渋谷)でのみ表示
 * これにより既存（未スコープ）データが消えず、他店舗には新規作成分だけが見える。
 */
export function isRecordInStore(record: { storeId?: string }, currentStoreId: string): boolean {
  if (record.storeId) {
    return record.storeId === currentStoreId;
  }
  return currentStoreId === defaultStoreId;
}

/** storeId を持つレコード配列を現在店舗で安全にフィルタする（非破壊・元配列は変更しない）。 */
export function filterRecordsByStore<T extends { storeId?: string }>(list: T[], currentStoreId: string): T[] {
  return list.filter((record) => isRecordInStore(record, currentStoreId));
}
