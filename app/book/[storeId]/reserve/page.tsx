import { OnlineBookingPage } from "@/features/online-booking/online-booking-page";

// 公開予約サイト 予約（メニュー選択→日時→お客様情報→完了のウィザード）。
// ?menu=<コースID> が付いていれば、そのコースを選択済みの状態で開始する（メニュー画面からの導線）。
export default async function BookReservePage({
  params,
  searchParams
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ menu?: string }>;
}) {
  const { storeId } = await params;
  const { menu } = await searchParams;
  return <OnlineBookingPage storeId={storeId} initialMenuId={menu} />;
}
