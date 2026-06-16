import type { ServiceMenu } from "@/features/master-data/types";

// メニューの提供店舗スコープ判定（T065・非破壊）。
// 予約作成・予約台帳の「メニュー選択候補」だけを絞るために使う。
// 過去予約のメニュー名 lookup（full配列）には使わない（履歴を壊さないため）。

type MenuScopeFields = Pick<ServiceMenu, "storeScope" | "storeIds">;

/**
 * 現在店舗でこのメニューが提供対象か。
 * - storeScope が "selected" でない（未設定 or "all"）→ 全店共通＝常に true
 * - storeScope === "selected" → storeIds に currentStoreId が含まれる場合のみ true
 */
export function isMenuInStore(menu: MenuScopeFields, currentStoreId: string): boolean {
  if (menu.storeScope !== "selected") {
    return true;
  }
  return (menu.storeIds ?? []).includes(currentStoreId);
}

/** メニュー配列を現在店舗で安全にフィルタする（非破壊・元配列は変更しない）。 */
export function filterMenusByStore<T extends MenuScopeFields>(menus: T[], currentStoreId: string): T[] {
  return menus.filter((menu) => isMenuInStore(menu, currentStoreId));
}
