import { OnlineBookingPage } from "@/features/online-booking/online-booking-page";

// 公開予約サイト 予約（メニュー選択→日時→お客様情報→完了のウィザード）。
export default async function BookReservePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <OnlineBookingPage storeId={storeId} />;
}
