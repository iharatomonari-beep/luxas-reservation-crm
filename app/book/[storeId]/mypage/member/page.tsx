import { MyPageMember } from "@/features/online-booking/mypage";

// マイページ 会員情報（会員情報・メルマガ・アカウント）。
export default async function MyPageMemberRoute({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <MyPageMember storeId={storeId} />;
}
