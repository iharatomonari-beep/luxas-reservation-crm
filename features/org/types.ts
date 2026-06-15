// 多店舗展開・外販SaaSに向けた組織階層の型（T061）。
// tenant（契約法人）→ area（エリア）→ store（店舗）。
// 既存の予約/顧客/会計/StoreSettings には一切影響しない（強制FK追加なし・既存キー不変）。

export type Tenant = {
  id: string;
  /** 契約法人名 */
  name: string;
  isActive: boolean;
};

export type Area = {
  id: string;
  tenantId: string;
  /** エリア名 */
  name: string;
  isActive: boolean;
};

export type Store = {
  id: string;
  tenantId: string;
  areaId: string;
  /** 店舗名 */
  name: string;
  isActive: boolean;
};
