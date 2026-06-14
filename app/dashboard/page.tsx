import Link from "next/link";
import {
  ArrowUpDown,
  CalendarDays,
  CalendarClock,
  ContactRound,
  ChevronRight,
  ClipboardList,
  Store,
  UsersRound
} from "lucide-react";
import { TopKpi } from "@/features/analytics/top-kpi";

const quickActions = [
  {
    href: "/dashboard/reservations",
    title: "予約台帳",
    description: "電話受付中に空き枠を見ながら、作成・編集・キャンセルへ進みます。",
    icon: CalendarDays
  },
  {
    href: "/dashboard/customers",
    title: "顧客管理",
    description: "注意事項、カルテメモ、予約履歴をその場で確認します。",
    icon: ContactRound
  },
  {
    href: "/dashboard/import-export",
    title: "CSV入出力",
    description: "顧客、スタッフ、メニュー、予約の取り込みと書き出しを行います。",
    icon: ArrowUpDown
  }
];

const masterLinks = [
  {
    href: "/dashboard/staff",
    title: "スタッフ管理",
    description: "氏名、表示名、役割、有効状態",
    icon: UsersRound
  },
  {
    href: "/dashboard/services",
    title: "メニュー管理",
    description: "所要時間、価格、カテゴリ、有効状態",
    icon: ClipboardList
  },
  {
    href: "/dashboard/rooms",
    title: "ブース管理",
    description: "ブース名、種別、有効状態",
    icon: Store
  },
  {
    href: "/dashboard/shifts",
    title: "シフト管理",
    description: "スタッフ、日付、勤務時間、休憩",
    icon: CalendarClock
  }
];

const workItems = [
  {
    title: "電話受付",
    description: "予約台帳を開いて、顧客名・電話番号を先に確認します。",
    status: "1",
    icon: ArrowUpDown
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 border-b border-luxas-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-luxas-green">Dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold text-luxas-ink">LUXAS 管理トップ</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            電話受付、顧客確認、CSV入出力へすぐ入れる、シンプルな管理画面です。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill>single store</Pill>
          <Pill>localStorage</Pill>
          <Pill>prototype</Pill>
        </div>
      </section>

      <TopKpi />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryPanel label="予約台帳" value="電話受付向け" detail="スタッフ別に空き枠を確認" />
        <SummaryPanel label="顧客管理" value="施術前確認" detail="注意事項とカルテを確認" />
        <SummaryPanel label="CSV入出力" value="4対象" detail="顧客、スタッフ、メニュー、予約" />
        <SummaryPanel label="マスタ管理" value="4画面" detail="スタッフ、メニュー、ブース、シフト" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-luxas-green" size={22} aria-hidden="true" />
            <h2 className="text-base font-semibold text-luxas-ink">主要導線</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start justify-between gap-4 rounded-md border border-luxas-line bg-luxas-paper p-4 transition hover:border-luxas-green hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-luxas-green ring-1 ring-inset ring-luxas-line">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-luxas-ink">{item.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-stone-600">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 text-stone-400 transition group-hover:text-luxas-green" size={18} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-luxas-line bg-white p-5">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-luxas-green" size={22} aria-hidden="true" />
              <h2 className="text-base font-semibold text-luxas-ink">管理メニュー</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {masterLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-md border border-luxas-line bg-white px-4 py-3 transition hover:border-luxas-green hover:bg-luxas-paper"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-luxas-mist text-luxas-green">
                        <Icon size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-luxas-ink">{item.title}</p>
                        <p className="text-xs text-stone-500">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-stone-400" size={16} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-luxas-line bg-white p-5">
            <div className="flex items-center gap-3">
              <Store className="text-luxas-gold" size={22} aria-hidden="true" />
              <h2 className="text-base font-semibold text-luxas-ink">運用の流れ</h2>
            </div>
            <div className="mt-4 space-y-3">
              {workItems.map((item) => (
                <div key={item.title} className="flex gap-3 rounded-md border border-luxas-line bg-luxas-paper p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-luxas-green ring-1 ring-inset ring-luxas-line">
                    {item.status}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-luxas-ink">{item.title}</p>
                    <p className="mt-1 text-sm leading-5 text-stone-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryPanel({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-luxas-line bg-white p-5">
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className="mt-3 text-xl font-semibold text-luxas-ink">{value}</p>
      <p className="mt-2 text-sm text-stone-500">{detail}</p>
    </div>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-luxas-line bg-white px-3 py-1 text-xs font-medium text-stone-600">
      {children}
    </span>
  );
}
