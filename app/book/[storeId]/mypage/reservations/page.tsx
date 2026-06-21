import { MyPageReservations } from "@/features/online-booking/mypage";

// マイページ 予約情報（予約履歴の一覧）。
export default async function MyPageReservationsRoute({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <MyPageReservations storeId={storeId} />;
}
