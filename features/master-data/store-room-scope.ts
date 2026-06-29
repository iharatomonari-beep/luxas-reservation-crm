import { currentStoreId as defaultStoreId } from "@/features/org/mock-data";
import type { ServiceRoom } from "@/features/master-data/types";

// ブース（rooms）の店舗スコープ判定（多店舗・案B）。
// 予約のブース空き判定（hasBoothCapacity）に渡す前に、現在店舗のブースだけに絞るために使う。
// staff の isStaffHomeStore / filterShiftsByStore と同方式（非破壊）。

/**
 * ブースが現在店舗のものか。
 * - room.homeStoreId === currentStoreId            … その店舗のブース
 * - homeStoreId 未設定 かつ 既定店舗(渋谷)           … 旧データは既定店舗のブース扱い
 */
export function isRoomInStore(room: Pick<ServiceRoom, "homeStoreId">, currentStoreId: string): boolean {
  if (room.homeStoreId) {
    return room.homeStoreId === currentStoreId;
  }
  return currentStoreId === defaultStoreId;
}

/** ブース配列を現在店舗で安全フィルタ（非破壊・元配列は変更しない）。 */
export function filterRoomsByStore<T extends Pick<ServiceRoom, "homeStoreId">>(list: T[], currentStoreId: string): T[] {
  return list.filter((room) => isRoomInStore(room, currentStoreId));
}
