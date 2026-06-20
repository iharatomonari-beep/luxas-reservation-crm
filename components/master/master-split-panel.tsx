"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";

export type MasterColumn<T> = {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
};

/**
 * PM準拠の共通スプリットパネル・マスタUI（T051）。
 * 左=一覧（名前検索/検索条件追加/新規作成＋行クリック選択）、右=明細設定（renderDetailに委譲）。
 * 既存マスタ画面の差し替えはT052で行う。単体では画面変化なし。
 */
export function MasterSplitPanel<T extends { id: string }>({
  items,
  columns,
  searchKeys,
  selectedId,
  onSelect,
  onCreate,
  renderDetail,
  searchPlaceholder = "名前で検索",
  createLabel = "新規作成",
  emptyListLabel = "該当する項目がありません。",
  emptyDetail = "左の一覧から選択するか「新規作成」を押してください。",
  gridClassName = "grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]",
  listMaxHeightClassName,
  filterSlot,
  detailTitle = "明細設定"
}: {
  items: T[];
  columns: MasterColumn<T>[];
  searchKeys?: (keyof T)[];
  selectedId?: string | null;
  onSelect: (item: T) => void;
  onCreate?: () => void;
  renderDetail: (selected: T | null) => ReactNode;
  searchPlaceholder?: string;
  createLabel?: string;
  emptyListLabel?: ReactNode;
  emptyDetail?: ReactNode;
  /** グリッド列比の上書き（任意）。明細を広く取りたい画面で渡す。 */
  gridClassName?: string;
  /** 一覧テーブルを縦スクロールにする最大高さクラス（任意・例: "max-h-[70vh]"）。 */
  listMaxHeightClassName?: string;
  /** 検索バーに差し込む追加フィルタUI（任意・例: カテゴリ絞り込み select）。 */
  filterSlot?: ReactNode;
  /** 右ペインの見出し（任意・既定「明細設定」）。 */
  detailTitle?: string;
}) {
  const [query, setQuery] = useState("");
  const detailRef = useRef<HTMLElement | null>(null);

  // 行を選択（または新規）したら、明細ペインを画面内へスクロールする（編集導線を見失わないため）。
  useEffect(() => {
    if (selectedId != null && typeof window !== "undefined" && window.innerWidth < 1280) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchKeys?.length) return items;
    return items.filter((item) =>
      searchKeys.some((key) => String(item[key] ?? "").toLowerCase().includes(q))
    );
  }, [items, query, searchKeys]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className={gridClassName}>
      {/* 左: 一覧 */}
      <section className="rounded-lg border border-luxas-line bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-luxas-line px-3 py-2.5">
          <label className="flex flex-1 items-center gap-2 rounded-md border border-luxas-line bg-white px-2.5 py-1.5">
            <Search size={15} className="text-stone-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-luxas-ink outline-none placeholder:text-stone-400"
            />
          </label>
          {filterSlot}
          <button
            type="button"
            disabled
            title="準備中"
            className="cursor-not-allowed rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm font-medium text-stone-300"
          >
            ＋ 検索条件追加
          </button>
          {onCreate ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 rounded-md bg-luxas-green px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Plus size={15} aria-hidden="true" />
              {createLabel}
            </button>
          ) : null}
        </div>

        <div className={["overflow-x-auto", listMaxHeightClassName ? `${listMaxHeightClassName} overflow-y-auto` : ""].filter(Boolean).join(" ")}>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={["px-3 py-2.5", column.className].filter(Boolean).join(" ")}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-luxas-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center text-stone-500">
                    {emptyListLabel}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const active = item.id === selectedId;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className={[
                        "cursor-pointer transition",
                        active ? "bg-luxas-mist" : "hover:bg-luxas-paper/60"
                      ].join(" ")}
                    >
                      {columns.map((column) => (
                        <td key={column.key} className={["px-3 py-2.5", column.className].filter(Boolean).join(" ")}>
                          {column.render(item)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 右: 明細設定 */}
      <section ref={detailRef} className="rounded-lg border border-luxas-line bg-white">
        <div className="border-b border-luxas-line px-4 py-2.5 text-sm font-semibold text-luxas-ink">{detailTitle}</div>
        <div className="px-4 py-4">
          {selected || selectedId === "" ? (
            renderDetail(selected)
          ) : (
            <p className="text-sm text-stone-500">{emptyDetail}</p>
          )}
        </div>
      </section>
    </div>
  );
}
