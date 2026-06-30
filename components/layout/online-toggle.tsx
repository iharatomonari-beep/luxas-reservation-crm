"use client";

import { Globe } from "lucide-react";
import { useCurrentStore } from "@/features/org/use-current-store";
import { useStoreSettings } from "@/features/master-data/store-settings";

// ⑤ 店舗全体のオンライン予約オンオフ（PMの地球儀アイコン同等・上部バー右）。
// 現在店舗の store-settings.onlineReservationEnabled をトグルする。公開予約ページは既にこのフラグを参照。
export function OnlineToggle() {
  const { currentStoreId } = useCurrentStore();
  const [settings, setSettings, isHydrated] = useStoreSettings(currentStoreId);
  const on = settings.onlineReservationEnabled !== false;

  return (
    <button
      type="button"
      disabled={!isHydrated}
      onClick={() => setSettings((current) => ({ ...current, onlineReservationEnabled: !(current.onlineReservationEnabled !== false) }))}
      title={on ? "オンライン予約: 受付中（クリックで停止）" : "オンライン予約: 停止中（クリックで再開）"}
      aria-pressed={on}
      className={[
        "inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition disabled:opacity-50",
        on
          ? "border-luxas-line bg-white text-luxas-green hover:bg-luxas-mist"
          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      ].join(" ")}
    >
      <Globe size={16} aria-hidden="true" />
      <span className="hidden sm:inline">{on ? "オンライン受付中" : "オンライン停止中"}</span>
    </button>
  );
}
