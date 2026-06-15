// 組織階層モジュール（T061）の公開エントリ。
// 型・初期データ・現在店舗IDをまとめて再エクスポートする（外販SaaS土台）。
export type { Tenant, Area, Store } from "@/features/org/types";
export {
  tenantsStorageKey,
  areasStorageKey,
  storesStorageKey,
  initialTenants,
  initialAreas,
  initialStores,
  currentStoreId
} from "@/features/org/mock-data";
