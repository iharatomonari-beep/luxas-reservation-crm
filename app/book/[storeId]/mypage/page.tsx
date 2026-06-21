import { MyPageHome } from "@/features/online-booking/mypage";

// マイページ ホーム（予約情報・会員情報のサマリ）。
export default async function MyPageHomeRoute({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <MyPageHome storeId={storeId} />;
}
