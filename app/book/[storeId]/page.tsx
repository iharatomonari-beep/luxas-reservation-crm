import { HomeView } from "@/features/online-booking/home-view";

// 公開予約サイト ホーム（認証なし）。例: /book/store-shibuya
export default async function BookHomePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <HomeView storeId={storeId} />;
}
