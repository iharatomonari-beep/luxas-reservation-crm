"use client";

import { Store as StoreIcon } from "lucide-react";
import { useCurrentStore } from "@/features/org/use-current-store";

/**
 * 上部バーの店舗切替（T062）。
 * 現在のテナント/エリア/店舗を表示し、店舗を切り替える。
 * この段階では選択しても既存画面のデータは変わらない（scopeはT063）。
 */
export function StoreSwitcher() {
  const { currentStoreId, setCurrentStoreId, store, area, tenant, stores, isHydrated } = useCurrentStore();

  if (!isHydrated) {
    return null;
  }

  const activeStores = stores.filter((s) => s.isActive);
  const contextLabel = [tenant?.name, area?.name].filter(Boolean).join(" / ");

  return (
    <div className="hidden items-center gap-1.5 lg:flex" title="店舗を切り替えます（現時点では表示データは変わりません）">
      <StoreIcon size={15} className="shrink-0 text-luxas-green" aria-hidden="true" />
      {contextLabel ? <span className="max-w-[160px] truncate text-xs text-stone-500">{contextLabel}</span> : null}
      <select
        value={currentStoreId}
        onChange={(event) => {
          const nextStoreId = event.target.value;
          // 同じ店舗を選んだ場合は何もしない（不要なリロードを避ける）。
          if (nextStoreId === currentStoreId) {
            return;
          }
          // 先に localStorage へ保存してから画面を再読み込み（各画面が選択店舗のscopeで描画される）。
          // リロードはユーザー操作（onChange）でのみ発生するため、ループにならない。
          setCurrentStoreId(nextStoreId);
          window.location.reload();
        }}
        className="rounded-md border border-luxas-line bg-white px-2 py-1.5 text-xs font-medium text-luxas-ink outline-none focus:border-luxas-green"
        aria-label="現在の店舗"
      >
        {store && !activeStores.some((s) => s.id === store.id) ? (
          <option value={store.id}>{store.name}</option>
        ) : null}
        {activeStores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
