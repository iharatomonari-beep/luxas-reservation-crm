import type { Area, Store, Tenant } from "@/features/org/types";

// localStorageキー（新規・既存キーとは衝突しない）。
export const tenantsStorageKey = "luxas-tenants";
export const areasStorageKey = "luxas-areas";
export const storesStorageKey = "luxas-stores";

// 初期データ: 株式会社東邦 → 東京 → LUXAS渋谷 の1件構成。
export const initialTenants: Tenant[] = [
  { id: "tenant-toho", name: "株式会社東邦", isActive: true }
];

export const initialAreas: Area[] = [
  { id: "area-tokyo", tenantId: "tenant-toho", name: "東京", isActive: true }
];

export const initialStores: Store[] = [
  { id: "store-shibuya", tenantId: "tenant-toho", areaId: "area-tokyo", name: "LUXAS渋谷", isActive: true }
];

// 現在の店舗（単一店舗運用の既定）。
export const currentStoreId = "store-shibuya";
