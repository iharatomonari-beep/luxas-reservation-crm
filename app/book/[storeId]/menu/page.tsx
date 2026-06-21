import { MenuView } from "@/features/online-booking/menu-view";

// 公開予約サイト メニュー（オンライン掲載コース一覧）。
export default async function BookMenuPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <MenuView storeId={storeId} />;
}
