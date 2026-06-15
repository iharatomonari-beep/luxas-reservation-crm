import { redirect } from "next/navigation";

// タグは種別ごとに3画面へ分離（T054）。旧統合ルートは顧客タグへ誘導。
export default function TagsPage() {
  redirect("/dashboard/customer-tags");
}
