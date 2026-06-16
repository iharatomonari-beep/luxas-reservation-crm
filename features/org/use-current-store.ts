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
  const [stores, setStores] = useLocalCollection<Store>(storesStorageKey, initialStores);

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

  // 店舗データの補完（古いlocalStorageに 0件/1件/一部欠けの店舗が残っていても7店舗を表示できるようにする）。
  // 既存店舗（store-shibuya 等）は維持し、initialStores のうち未保存IDだけを追加する（破壊しない）。
  useEffect(() => {
    const existingIds = new Set(stores.map((s) => s.id));
    const missing = initialStores.filter((s) => !existingIds.has(s.id));
    if (missing.length === 0) {
      return;
    }
    setStores((current) => {
      const currentIds = new Set(current.map((s) => s.id));
      const toAdd = initialStores.filter((s) => !currentIds.has(s.id));
      if (toAdd.length === 0) {
        return current;
      }
      return [...current, ...toAdd].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    });
  }, [stores, setStores]);

  // 現在店舗IDが存在しない店舗を指している場合だけ、既定店舗（store-shibuya）に戻す。
  useEffect(() => {
    if (!isHydrated || stores.length === 0) {
      return;
    }
    if (!stores.some((s) => s.id === currentStoreId)) {
      setCurrentStoreIdState(defaultStoreId);
      try {
        window.localStorage.setItem(currentStoreStorageKey, defaultStoreId);
      } catch {
        // 保存失敗は無視（メモリ上は既定店舗に戻る）。
      }
    }
  }, [isHydrated, stores, currentStoreId]);

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
