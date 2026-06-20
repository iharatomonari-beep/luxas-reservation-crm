"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

function readStoredCollection<T>(storageKey: string) {
  try {
    const savedItems = window.localStorage.getItem(storageKey);

    if (!savedItems) {
      return null;
    }

    const parsedItems = JSON.parse(savedItems);

    return Array.isArray(parsedItems) ? (parsedItems as T[]) : null;
  } catch {
    return null;
  }
}

// 古い localStorage に残った少数データを、コード側で初期データへ強制再シードして直す仕組み。
// ここに key と token を書くと、その key のデータは次回読み込み時に1度だけ initialItems で上書きされる。
// token の値を変えれば再度リセットがかかる。対象外の key は従来通り（影響なし）。
const SEED_RESET_TOKENS: Record<string, string> = {
  "luxas-master-rooms-v2": "2026-06-13-booths-10",
  "luxas-master-staff": "2026-06-21-staff-pm7stores-courses",
  "luxas-master-shifts-v2": "2026-06-20-shifts-pm7stores",
  // コース／カテゴリを PM実データ（7店舗・全カテゴリ375件＋14カテゴリ）に置換。古いlocalStorageを強制再シード。
  "luxas-master-services": "2026-06-21-services-pm-all375",
  "luxas-master-categories": "2026-06-21-categories-pm14",
  // 会計アイテムを4区分→6区分に作り直し（割引/回数券利用/チケット利用/回数券販売/チケット販売/物販）。
  "luxas-checkout-items": "2026-06-20-checkout-6kinds"
};

export function useLocalCollection<T>(storageKey: string, initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const resetToken = SEED_RESET_TOKENS[storageKey];

    if (resetToken) {
      const tokenKey = `${storageKey}::seed`;

      if (window.localStorage.getItem(tokenKey) !== resetToken) {
        // 古いデータを破棄して初期データで再シード（stale localStorage の自動修復）
        window.localStorage.setItem(tokenKey, resetToken);
        window.localStorage.setItem(storageKey, JSON.stringify(initialItems));
        setItems(initialItems);
        setIsHydrated(true);
        return;
      }
    }

    const storedItems = readStoredCollection<T>(storageKey);

    if (storedItems) {
      setItems(storedItems);
    }

    setIsHydrated(true);
  }, [storageKey, initialItems]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [isHydrated, items, storageKey]);

  useEffect(() => {
    if (!isHydrated) {
      return () => undefined;
    }

    // Sync from other tabs so a save in the reservation popup shows up on the ledger immediately.
    function syncFromStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage || event.key !== storageKey) {
        return;
      }

      const storedItems = readStoredCollection<T>(storageKey);

      if (storedItems) {
        setItems(storedItems);
      }
    }

    function syncOnFocus() {
      const storedItems = readStoredCollection<T>(storageKey);

      if (storedItems) {
        setItems(storedItems);
      }
    }

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncOnFocus);
    window.addEventListener("pageshow", syncOnFocus);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncOnFocus);
      window.removeEventListener("pageshow", syncOnFocus);
    };
  }, [isHydrated, storageKey]);

  return [items, setItems] as const satisfies readonly [T[], Dispatch<SetStateAction<T[]>>];
}
