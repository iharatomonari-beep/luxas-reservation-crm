"use client";

// 公開サイト マップ（PMの /map 相当）: Googleマップ埋め込み＋店舗情報＋右ログイン。
import { useStoreSettings } from "@/features/master-data/store-settings";
import { initialStores } from "@/features/org/mock-data";
import { LoginCard, StoreInfoCard } from "@/features/online-booking/public-sidebar";

export function MapView({ storeId }: { storeId: string }) {
  const [settings] = useStoreSettings();
  const store = initialStores.find((s) => s.id === storeId);

  const address = [settings.prefecture, settings.city, settings.address2].filter(Boolean).join("");
  const query = address || store?.name || "LUXAS";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-lg border border-luxas-line bg-white">
            <iframe
              title="店舗地図"
              src={mapSrc}
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <StoreInfoCard storeId={storeId} />
        </div>

        <aside className="space-y-4">
          <LoginCard />
        </aside>
      </div>
    </main>
  );
}
