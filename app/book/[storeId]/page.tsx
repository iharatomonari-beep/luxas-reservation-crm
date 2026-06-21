import { OnlineBookingPage } from "@/features/online-booking/online-booking-page";

// 公開オンライン予約ページ（認証なし）。HP店舗ページ／スマホアプリからの遷移先。
// 例: /book/store-shibuya
export default async function BookPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <OnlineBookingPage storeId={storeId} />;
}
