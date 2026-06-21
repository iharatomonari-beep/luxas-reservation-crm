"use client";

// 公開サイト メニュー（PMの /menu 相当）: オンライン掲載コースをカテゴリ別にカード表示。
import { useMemo } from "react";
import Link from "next/link";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { initialServices, servicesStorageKey } from "@/features/master-data/mock-data";
import { onlineMenusForStore } from "@/features/reservations/availability";
import { compareBySortOrder, formatCurrency } from "@/features/master-data/utils";
import type { ServiceMenu } from "@/features/master-data/types";
import { LoginCard } from "@/features/online-booking/public-sidebar";
import { PM_NAVY } from "@/features/online-booking/public-shell";

export function MenuView({ storeId }: { storeId: string }) {
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);

  const grouped = useMemo(() => {
    const menus = onlineMenusForStore(services, storeId).sort(compareBySortOrder);
    const order: string[] = [];
    const map = new Map<string, ServiceMenu[]>();
    for (const m of menus) {
      const key = m.category || "その他";
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(m);
    }
    return order.map((cat) => ({ cat, items: map.get(cat)! }));
  }, [services, storeId]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {grouped.length === 0 ? (
            <p className="rounded-md border border-luxas-line bg-white p-4 text-sm text-stone-500">
              この店舗のオンライン予約可能なコースがありません。
            </p>
          ) : (
            grouped.map(({ cat, items }) => (
              <section key={cat} className="rounded-lg border border-luxas-line bg-white p-5">
                <h2 className="mb-3 text-base font-bold text-luxas-ink">{cat}</h2>
                <ul className="divide-y divide-luxas-line">
                  {items.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-3">
                      <span className="h-12 w-12 shrink-0 rounded-full bg-luxas-mist" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-luxas-ink">{m.name}</p>
                        <p className="mt-0.5 text-xs text-stone-500">{m.durationMinutes}分</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-luxas-ink">{formatCurrency(m.price)}</span>
                      <Link
                        href={`/book/${storeId}/reserve?menu=${m.id}`}
                        className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: PM_NAVY }}
                      >
                        予約する
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <aside className="space-y-4">
          <LoginCard storeId={storeId} />
        </aside>
      </div>
    </main>
  );
}
