import { notFound } from "next/navigation";
import { CalendarDays, Clock3, ContactRound, Settings } from "lucide-react";

const sections = {
  reservations: {
    title: "予約台帳",
    description: "日別の予約一覧はDay 3で実装予定です。",
    icon: CalendarDays
  },
  grid: {
    title: "時間グリッド",
    description: "スタッフ別の時間グリッドはDay 4で実装予定です。",
    icon: Clock3
  },
  customers: {
    title: "顧客・カルテ",
    description: "顧客検索とカルテはDay 5で実装予定です。",
    icon: ContactRound
  },
  settings: {
    title: "店舗設定",
    description: "営業時間と予約単位の設定は後続実装で扱います。",
    icon: Settings
  }
} as const;

type SectionKey = keyof typeof sections;

export default async function DashboardSectionPage({
  params
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!isSectionKey(section)) {
    notFound();
  }

  const item = sections[section];
  const Icon = item.icon;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-luxas-green">準備中</p>
        <h1 className="mt-2 text-2xl font-semibold text-luxas-ink">{item.title}</h1>
        <p className="mt-2 text-sm text-stone-600">{item.description}</p>
      </div>

      <section className="rounded-lg border border-dashed border-luxas-line bg-white p-8">
        <div className="flex max-w-xl items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-luxas-mist text-luxas-green">
            <Icon aria-hidden="true" size={22} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-luxas-ink">Day 1では画面枠のみ</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              このページにはまだ業務データの表示・登録機能を置いていません。設計ドキュメントに沿って、各Dayで機能を追加します。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function isSectionKey(section: string): section is SectionKey {
  return section in sections;
}
