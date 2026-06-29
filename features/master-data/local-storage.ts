"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { tableConfig } from "./migration-config";
import type { DbContext, TableMapper } from "./mappers/types";
import { loadDbContext, loadRows, syncToSupabase } from "./remote-collection";

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
  "luxas-master-shifts-v2": "2026-06-21-shifts-early-mid-late-bands",
  // コース／カテゴリを PM実データ（7店舗・全カテゴリ375件＋14カテゴリ）に置換。古いlocalStorageを強制再シード。
  "luxas-master-services": "2026-06-21-services-pm-all375",
  "luxas-master-categories": "2026-06-21-categories-pm14",
  // 会計アイテムを4区分→6区分に作り直し（割引/回数券利用/チケット利用/回数券販売/チケット販売/物販）。
  "luxas-checkout-items": "2026-06-20-checkout-6kinds",
  // 物販カテゴリ／商品を PM実データ（有効・現役7店舗＋本部・名前+価格で重複排除）に置換。
  "luxas-retail-categories": "2026-06-21-retail-pm",
  "luxas-retail-items": "2026-06-21-retail-pm",
  // オプションを PM実データ（有効・現役7店舗＋本部・名前+価格で重複排除・延長/割引/他を判定）に置換。
  "luxas-master-options": "2026-06-21-options-pm"
};

export function useLocalCollection<T>(storageKey: string, initialItems: T[]) {
  const config = tableConfig(storageKey);
  const backend = config?.backend ?? "local";
  const mapper = (config?.mapper as unknown as TableMapper<T> | undefined) ?? undefined;
  const useSupabase = backend === "supabase" && Boolean(mapper);

  const [items, setItems] = useState<T[]>(initialItems);
  const [isHydrated, setIsHydrated] = useState(false);
  // Supabase書き込みの差分検出に使う「直前に永続化済みの配列」。
  const prevRef = useRef<T[]>(initialItems);
  // Supabaseの実行コンテキスト（テナント・店舗解決）。
  const ctxRef = useRef<DbContext | null>(null);

  // ---- ハイドレート（初期読み込み）----
  useEffect(() => {
    if (useSupabase && mapper) {
      // Supabase 管理のテーブルは localStorage を「正」にしない。移行前の古い残骸が
      // 残っていると、再ハイドレート経路（台帳の focus/storage 同期等）がそれでDBデータを
      // 上書きし、切替層が「差分=削除」と誤判定してDB行を消す事故につながる。
      // ハイドレート時に当該キーの localStorage を破棄して根絶する。
      try {
        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem(`${storageKey}::seed`);
      } catch {
        // localStorage 不可環境でも処理継続。
      }
      let cancelled = false;
      (async () => {
        try {
          const ctx = await loadDbContext();
          const rows = await loadRows(mapper.table);
          if (cancelled) {
            return;
          }
          ctxRef.current = ctx;
          const mapped = rows.map((row) => mapper.fromRow(row));
          prevRef.current = mapped;
          setItems(mapped);
        } catch (error) {
          console.error(`[supabase] load ${mapper.table} failed`, error);
        } finally {
          if (!cancelled) {
            setIsHydrated(true);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    // ---- localStorage 経路（従来動作）----
    const resetToken = SEED_RESET_TOKENS[storageKey];

    if (resetToken) {
      const tokenKey = `${storageKey}::seed`;

      if (window.localStorage.getItem(tokenKey) !== resetToken) {
        // 古いデータを破棄して初期データで再シード（stale localStorage の自動修復）
        window.localStorage.setItem(tokenKey, resetToken);
        window.localStorage.setItem(storageKey, JSON.stringify(initialItems));
        prevRef.current = initialItems;
        setItems(initialItems);
        setIsHydrated(true);
        return;
      }
    }

    const storedItems = readStoredCollection<T>(storageKey);

    if (storedItems) {
      prevRef.current = storedItems;
      setItems(storedItems);
    }

    setIsHydrated(true);
    return;
  }, [storageKey, backend, initialItems, mapper, useSupabase]);

  // ---- 永続化（変更の保存）----
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (useSupabase && mapper) {
      const prev = prevRef.current;
      void syncToSupabase(mapper, ctxRef.current, prev, items)
        .then(() => {
          prevRef.current = items;
        })
        .catch((error) => {
          console.error(`[supabase] sync ${mapper.table} failed`, error);
        });
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
    prevRef.current = items;
  }, [isHydrated, items, storageKey, backend, mapper, useSupabase]);

  // ---- 別タブ/復帰時の同期 ----
  useEffect(() => {
    if (!isHydrated) {
      return () => undefined;
    }

    if (useSupabase && mapper) {
      // 復帰時にDBから取り直す（簡易同期）。
      const refetch = () => {
        loadRows(mapper.table)
          .then((rows) => {
            const mapped = rows.map((row) => mapper.fromRow(row));
            prevRef.current = mapped;
            setItems(mapped);
          })
          .catch(() => undefined);
      };

      window.addEventListener("focus", refetch);
      window.addEventListener("pageshow", refetch);

      return () => {
        window.removeEventListener("focus", refetch);
        window.removeEventListener("pageshow", refetch);
      };
    }

    // Sync from other tabs so a save in the reservation popup shows up on the ledger immediately.
    function syncFromStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage || event.key !== storageKey) {
        return;
      }

      const storedItems = readStoredCollection<T>(storageKey);

      if (storedItems) {
        prevRef.current = storedItems;
        setItems(storedItems);
      }
    }

    function syncOnFocus() {
      const storedItems = readStoredCollection<T>(storageKey);

      if (storedItems) {
        prevRef.current = storedItems;
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
  }, [isHydrated, storageKey, backend, mapper, useSupabase]);

  return [items, setItems] as const satisfies readonly [T[], Dispatch<SetStateAction<T[]>>];
}
