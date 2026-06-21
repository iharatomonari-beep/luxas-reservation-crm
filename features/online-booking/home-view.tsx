"use client";

// 公開サイト ホーム（PMの /home 相当）: ヒーロー＋紹介文＋店舗情報＋右ログイン。
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { useStoreSettings } from "@/features/master-data/store-settings";
import { initialStores } from "@/features/org/mock-data";
import { LoginCard, StoreInfoCard } from "@/features/online-booking/public-sidebar";
import { PM_NAVY } from "@/features/online-booking/public-shell";
import { InstallButton } from "@/features/online-booking/pwa-client";

const DEFAULT_DESC =
  "ご予約はページ上部の「予約」ボタンから進めます。コースを選択後、スタッフのご希望（指名・男性・女性）がございましたらスタッフリストよりお選びください。ご連絡のないキャンセルや当日キャンセルが続いた場合、次回以降のご予約をお断りする場合がございます。キャンセル・遅刻の際は必ずお電話またはメールでご連絡ください。";

export function HomeView({ storeId }: { storeId: string }) {
  const [settings] = useStoreSettings();
  const store = initialStores.find((s) => s.id === storeId);
  const description = settings.hpDescription || DEFAULT_DESC;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <HeroGallery storeName={store?.name ?? "LUXAS"} imageUrl={settings.hpImageUrl} />

          {/* 予約CTA＋本日の営業時間 */}
          <div className="flex flex-col items-stretch gap-3 rounded-lg border border-luxas-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-stone-600">
              <p className="font-semibold text-luxas-ink">ネット予約受付中</p>
              <p className="mt-0.5 text-xs">営業時間 {settings.businessStartTime}〜{settings.businessEndTime}　予約受付 〜{settings.reservationAcceptEndTime || settings.businessEndTime}</p>
            </div>
            <Link
              href={`/book/${storeId}/reserve`}
              className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: PM_NAVY }}
            >
              <CalendarCheck size={18} aria-hidden="true" />今すぐ予約する
            </Link>
          </div>

          <article className="rounded-lg border border-luxas-line bg-white p-5">
            <Carousel />
            <p className="mt-4 text-sm leading-7 text-stone-700">{description}</p>
          </article>

          <StoreInfoCard storeId={storeId} />
        </div>

        <aside className="space-y-4">
          <InstallButton />
          <LoginCard storeId={storeId} />
        </aside>
      </div>
    </main>
  );
}

// ヒーロー: 3枚並び。中央はロゴ（実画像が無いためプレースホルダ）。
function HeroGallery({ storeName, imageUrl }: { storeName: string; imageUrl?: string }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 overflow-hidden rounded-lg">
      <Tile imageUrl={imageUrl} />
      <div className="flex aspect-[4/3] items-center justify-center" style={{ backgroundColor: PM_NAVY }}>
        <div className="text-center text-white">
          <p className="text-[9px] tracking-widest opacity-80">TOHO MASSAGE GROUP</p>
          <p className="text-2xl font-bold leading-none">LUXAS</p>
          <p className="mt-1 text-xs">ラクサス</p>
        </div>
      </div>
      <Tile imageUrl={imageUrl} />
      <div className="col-span-3 mt-1 text-center text-xs text-stone-400">{storeName}</div>
    </div>
  );
}

function Tile({ imageUrl }: { imageUrl?: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />;
  }
  return <div className="flex aspect-[4/3] items-center justify-center bg-luxas-mist text-xs text-stone-400">写真</div>;
}

// カルーセル: 3サムネ＋ドット（第1段は静的なプレースホルダ）。
function Carousel() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-md bg-luxas-mist text-xs text-stone-400"
          >
            写真
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={["h-1.5 w-1.5 rounded-full", i === 0 ? "bg-luxas-ink" : "bg-luxas-line"].join(" ")} />
        ))}
      </div>
    </div>
  );
}
