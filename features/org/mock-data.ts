import type { Area, Store, Tenant } from "@/features/org/types";

// localStorageキー（新規・既存キーとは衝突しない）。
export const tenantsStorageKey = "luxas-tenants";
export const areasStorageKey = "luxas-areas";
export const storesStorageKey = "luxas-stores";

// 初期データ: 株式会社東邦 → 東京エリア → 実店舗7店舗。
export const initialTenants: Tenant[] = [
  { id: "tenant-toho", name: "株式会社東邦", isActive: true }
];

export const initialAreas: Area[] = [
  { id: "area-tokyo", tenantId: "tenant-toho", name: "東京", isActive: true }
];

// 全店舗 tenant-toho / area-tokyo 配下。既定店舗は LUXAS渋谷（sortOrder 1）。
export const initialStores: Store[] = [
  { id: "store-shibuya", tenantId: "tenant-toho", areaId: "area-tokyo", name: "LUXAS渋谷", code: "SHIBUYA", sortOrder: 1, isActive: true },
  { id: "store-gotanda-east", tenantId: "tenant-toho", areaId: "area-tokyo", name: "LUXAS五反田東口", code: "GOTANDA_EAST", sortOrder: 2, isActive: true },
  { id: "store-gotanda-west", tenantId: "tenant-toho", areaId: "area-tokyo", name: "LUXAS五反田西口", code: "GOTANDA_WEST", sortOrder: 3, isActive: true },
  { id: "store-kinshicho", tenantId: "tenant-toho", areaId: "area-tokyo", name: "LUXAS錦糸町", code: "KINSHICHO", sortOrder: 4, isActive: true },
  { id: "store-mizonokuchi-premium", tenantId: "tenant-toho", areaId: "area-tokyo", name: "LUXASプレミアム溝の口", code: "MIZONOKUCHI_PREMIUM", sortOrder: 5, isActive: true },
  { id: "store-motomachi-chukagai-plus", tenantId: "tenant-toho", areaId: "area-tokyo", name: "LUXAS＋元町中華街", code: "MOTOMACHI_CHUKAGAI_PLUS", sortOrder: 6, isActive: true },
  { id: "store-nakameguro", tenantId: "tenant-toho", areaId: "area-tokyo", name: "LUXAS中目黒", code: "NAKAMEGURO", sortOrder: 7, isActive: true }
];

// 現在の店舗の既定（引き続き LUXAS渋谷）。
export const currentStoreId = "store-shibuya";
