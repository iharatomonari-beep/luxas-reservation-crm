import { MapView } from "@/features/online-booking/map-view";

// 公開予約サイト マップ（Googleマップ埋め込み＋店舗情報）。
export default async function BookMapPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <MapView storeId={storeId} />;
}
