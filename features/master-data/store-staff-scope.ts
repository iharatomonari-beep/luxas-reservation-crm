import { currentStoreId as defaultStoreId } from "@/features/org/mock-data";
import type { StaffMember, StaffShift } from "@/features/master-data/types";

/**
 * シフトの店舗スコープ判定（T064・非破壊）。
 * - shift.storeId === currentStoreId            … その店舗のシフト
 * - または (!shift.storeId) かつ 既定店舗        … storeId未設定の既存シフトは既定店舗(渋谷)のシフト扱い
 * ヘルプ勤務は「応援先店舗の storeId を持つシフト」で表現できる（所属店舗に依存しない）。
 */
export function isShiftInStore(shift: Pick<StaffShift, "storeId">, currentStoreId: string): boolean {
  if (shift.storeId) {
    return shift.storeId === currentStoreId;
  }
  return currentStoreId === defaultStoreId;
}

/** シフト配列を現在店舗で安全フィルタ（非破壊・元配列は変更しない）。 */
export function filterShiftsByStore<T extends Pick<StaffShift, "storeId">>(list: T[], currentStoreId: string): T[] {
  return list.filter((shift) => isShiftInStore(shift, currentStoreId));
}

/**
 * スタッフの所属店舗判定（T064・非破壊）。homeStoreId 未設定は既定店舗(渋谷)所属扱い。
 * 注意: 台帳の縦軸は所属だけでは表示しない（シフト基準）。この判定はスタッフ名簿の絞り込み等の補助用途。
 */
export function isStaffHomeStore(staff: Pick<StaffMember, "homeStoreId">, currentStoreId: string): boolean {
  if (staff.homeStoreId) {
    return staff.homeStoreId === currentStoreId;
  }
  return currentStoreId === defaultStoreId;
}
