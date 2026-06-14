"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpDown,
  CalendarDays,
  CalendarClock,
  Clock3,
  ContactRound,
  LayoutDashboard,
  ListChecks,
  Mail,
  Settings,
  Store,
  UsersRound
} from "lucide-react";

const navigationItems = [
  { href: "/dashboard", label: "トップ", icon: LayoutDashboard },
  { href: "/dashboard/reservations", label: "予約台帳", icon: CalendarDays },
  { href: "/dashboard/reservations/list", label: "予約一覧", icon: ListChecks },
  { href: "/dashboard/reservations/returns", label: "返客一覧", icon: ListChecks },
  { href: "/dashboard/grid", label: "時間グリッド", icon: Clock3 },
  { href: "/dashboard/customers", label: "顧客管理", icon: ContactRound },
  { href: "/dashboard/customers/search", label: "顧客フル検索", icon: ContactRound },
  { href: "/dashboard/tags", label: "タグ管理", icon: ListChecks },
  { href: "/dashboard/import-export", label: "CSV入出力", icon: ArrowUpDown },
  { href: "/dashboard/staff", label: "スタッフ", icon: UsersRound },
  { href: "/dashboard/services", label: "メニュー", icon: ListChecks },
  { href: "/dashboard/categories", label: "カテゴリ", icon: ListChecks },
  { href: "/dashboard/options", label: "オプション", icon: ListChecks },
  { href: "/dashboard/rooms", label: "ブース", icon: Store },
  { href: "/dashboard/shifts", label: "シフト", icon: CalendarClock },
  { href: "/dashboard/shifts/monthly", label: "月間シフト", icon: CalendarDays },
  { href: "/dashboard/retail", label: "物販販売", icon: Store },
  { href: "/dashboard/retail-items", label: "物販商品", icon: Store },
  { href: "/dashboard/mail", label: "メール管理", icon: Mail },
  { href: "/dashboard/analytics", label: "経営指標", icon: LayoutDashboard },
  { href: "/dashboard/analytics/reports", label: "詳細帳票", icon: ListChecks },
  { href: "/dashboard/daily", label: "日次管理", icon: CalendarClock },
  { href: "/dashboard/expense-accounts", label: "経費マスタ", icon: ListChecks },
  { href: "/dashboard/creditcards", label: "クレカ会社", icon: ListChecks },
  { href: "/dashboard/emoney", label: "電子マネー", icon: ListChecks },
  { href: "/dashboard/settings", label: "店舗設定", icon: Settings }
];

export function Sidebar({
  isOpen,
  onNavigate
}: {
  isOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-30 w-72 transform border-r border-luxas-line bg-white transition md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      ].join(" ")}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-luxas-line px-5 py-5">
          <p className="text-lg font-semibold tracking-normal text-luxas-ink">LUXAS</p>
          <p className="mt-1 text-xs text-stone-500">single store prototype</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="管理メニュー">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-luxas-mist text-luxas-green"
                    : "text-stone-700 hover:bg-luxas-paper hover:text-luxas-ink"
                ].join(" ")}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-luxas-line px-5 py-4 text-xs leading-5 text-stone-500">
          v0.1 Day 7<br />
          予約操作はlocalStorageで動作
        </div>
      </div>
    </aside>
  );
}
