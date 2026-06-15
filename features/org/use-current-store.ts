"use client";

import { useEffect, useState } from "react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  areasStorageKey,
  currentStoreId as defaultStoreId,
  initialAreas,
  initialStores,
  initialTenants,
  storesStorageKey,
  tenantsStorageKey
} from "@/features/org/mock-data";
import type { Area, Store, Tenant } from "@/features/org/types";

// 現在店舗IDのlocalStorageキー（新規・既存キーと衝突しない）。
export const currentStoreStorageKey = "luxas-current-store-id";

/**
 * 現在店舗コンテキスト（T062）。
 * 現在店舗ID・その店舗/エリア/テナント・店舗一覧・切替関数を返す。
 * この段階では既存の予約/顧客/会計データは絞り込まない（scopeはT063）。
 */
export function useCurrentStore() {
  const [tenants] = useLocalCollection<Tenant>(tenantsStorageKey, initialTenants);
  const [areas] = useLocalCollection<Area>(areasStorageKey, initialAreas);
  const [stores] = useLocalCollection<Store>(storesStorageKey, initialStores);

  const [currentStoreId, setCurrentStoreIdState] = useState<string>(defaultStoreId);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(currentStoreStorageKey);
      if (saved) {
        setCurrentStoreIdState(saved);
      }
    } catch {
      // 破損時は既定のまま。
    }
    setIsHydrated(true);
  }, []);

  function setCurrentStoreId(id: string) {
    setCurrentStoreIdState(id);
    try {
      window.localStorage.setItem(currentStoreStorageKey, id);
    } catch {
      // 保存失敗は無視（メモリ上は反映）。
    }
  }

  const store = stores.find((s) => s.id === currentStoreId) ?? null;
  const area = store ? areas.find((a) => a.id === store.areaId) ?? null : null;
  const tenant = store ? tenants.find((t) => t.id === store.tenantId) ?? null : null;

  return { currentStoreId, setCurrentStoreId, store, area, tenant, stores, areas, tenants, isHydrated };
}
