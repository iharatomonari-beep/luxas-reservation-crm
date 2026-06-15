"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type NavItem = { label: string; href: string };
type NavGroup = { key: string; label: string; href?: string; items?: NavItem[] };

// PM準拠の上部メニュー構成（既存ルートに割当て・/dashboard/grid は準備中のため載せない）。
const NAV_GROUPS: NavGroup[] = [
  { key: "top", label: "トップ", href: "/dashboard" },
  {
    key: "reservations",
    label: "予約台帳",
    items: [
      { label: "予約台帳", href: "/dashboard/reservations" },
      { label: "予約一覧", href: "/dashboard/reservations/list" },
      { label: "支払・レジ", href: "/dashboard/payments" },
      { label: "返客一覧", href: "/dashboard/reservations/returns" },
      { label: "物販販売", href: "/dashboard/retail" },
      { label: "シフト", href: "/dashboard/shifts" },
      { label: "月間シフト", href: "/dashboard/shifts/monthly" },
      { label: "本日のオンライン設定", href: "/dashboard/online-blocks" },
      { label: "シフトひな型", href: "/dashboard/shift-templates" },
      { label: "シフトパターン", href: "/dashboard/shift-patterns" },
      { label: "データ不備のお知らせ", href: "/dashboard/data-errors" }
    ]
  },
  {
    key: "daily",
    label: "日次管理",
    items: [
      { label: "日次管理", href: "/dashboard/daily" },
      { label: "出勤・退勤", href: "/dashboard/attendance" },
      { label: "開店処理", href: "/dashboard/open-register" },
      { label: "レジ金点検", href: "/dashboard/check-register" },
      { label: "閉店処理", href: "/dashboard/close-register" },
      { label: "閉店処理検索", href: "/dashboard/close-history" },
      { label: "売上日報", href: "/dashboard/daily-report" },
      { label: "月間目標入力", href: "/dashboard/shifts/monthly" },
      { label: "経費マスタ", href: "/dashboard/expense-accounts" }
    ]
  },
  {
    key: "store",
    label: "店舗情報",
    items: [
      { label: "店舗設定", href: "/dashboard/settings" },
      { label: "スタッフ", href: "/dashboard/staff" },
      { label: "ブース", href: "/dashboard/rooms" },
      { label: "クレカ会社", href: "/dashboard/creditcards" },
      { label: "電子マネー", href: "/dashboard/emoney" },
      { label: "ユーザ情報", href: "/dashboard/users" }
    ]
  },
  {
    key: "customers",
    label: "顧客情報",
    items: [
      { label: "顧客管理", href: "/dashboard/customers" },
      { label: "顧客フル検索", href: "/dashboard/customers/search" },
      { label: "顧客タグ", href: "/dashboard/customer-tags" },
      { label: "予約ルートタグ", href: "/dashboard/route-tags" },
      { label: "施術カルテタグ", href: "/dashboard/chart-tags" },
      { label: "CSV入出力", href: "/dashboard/import-export" }
    ]
  },
  {
    key: "products",
    label: "商品情報",
    items: [
      { label: "メニュー", href: "/dashboard/services" },
      { label: "カテゴリ", href: "/dashboard/categories" },
      { label: "オプション", href: "/dashboard/options" },
      { label: "セット商品", href: "/dashboard/course-sets" },
      { label: "物販商品", href: "/dashboard/retail-items" },
      { label: "物販カテゴリ", href: "/dashboard/retail-categories" },
      { label: "EPARK掲載設定", href: "/dashboard/epark" }
    ]
  },
  {
    key: "mail",
    label: "メール管理",
    items: [
      { label: "配信履歴", href: "/dashboard/mail" },
      { label: "配信一括停止", href: "/dashboard/mail/cancel" },
      { label: "定型文設定", href: "/dashboard/mail/templates" },
      { label: "eDM設定", href: "/dashboard/mail/edm" },
      { label: "シンプルeDM", href: "/dashboard/mail/edm-simple" }
    ]
  },
  {
    key: "analytics",
    label: "経営指標",
    items: [
      { label: "経営指標", href: "/dashboard/analytics" },
      { label: "詳細帳票", href: "/dashboard/analytics/reports" }
    ]
  }
];

function isLinkActive(pathname: string, href: string) {
  return pathname === href;
}

function isGroupActive(pathname: string, group: NavGroup) {
  if (group.href) {
    return pathname === group.href;
  }
  return (group.items ?? []).some((item) => isLinkActive(pathname, item.href));
}

export function TopMenu({ mobileOpen, onNavigate }: { mobileOpen: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // 外側クリックでドロップダウンを閉じる。
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenKey(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ルートが変わったら閉じる。
  useEffect(() => {
    setOpenKey(null);
  }, [pathname]);

  return (
    <>
      {/* PC: 横並びメニューバー（ドロップダウン） */}
      <div ref={navRef} className="hidden items-center gap-1 md:flex">
        {NAV_GROUPS.map((group) => {
          const active = isGroupActive(pathname, group);
          if (group.href) {
            return (
              <Link
                key={group.key}
                href={group.href}
                className={[
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "bg-luxas-mist text-luxas-green" : "text-luxas-ink hover:bg-luxas-paper"
                ].join(" ")}
              >
                {group.label}
              </Link>
            );
          }
          const open = openKey === group.key;
          return (
            <div key={group.key} className="relative">
              <button
                type="button"
                onClick={() => setOpenKey((current) => (current === group.key ? null : group.key))}
                className={[
                  "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition",
                  active || open ? "bg-luxas-mist text-luxas-green" : "text-luxas-ink hover:bg-luxas-paper"
                ].join(" ")}
              >
                {group.label}
                <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} aria-hidden="true" />
              </button>
              {open ? (
                <div className="absolute left-0 top-full z-30 mt-1 min-w-44 rounded-md border border-luxas-line bg-white py-1 shadow-soft">
                  {(group.items ?? []).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenKey(null)}
                      className={[
                        "block px-3 py-2 text-sm transition",
                        isLinkActive(pathname, item.href)
                          ? "bg-luxas-mist font-medium text-luxas-green"
                          : "text-luxas-ink hover:bg-luxas-paper"
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* モバイル: ハンバーガーで開く縦アコーディオン */}
      {mobileOpen ? (
        <div className="border-t border-luxas-line bg-white px-2 py-2 md:hidden">
          {NAV_GROUPS.map((group) => {
            if (group.href) {
              return (
                <Link
                  key={group.key}
                  href={group.href}
                  onClick={onNavigate}
                  className={[
                    "block rounded-md px-3 py-2 text-sm font-semibold transition",
                    isGroupActive(pathname, group) ? "bg-luxas-mist text-luxas-green" : "text-luxas-ink hover:bg-luxas-paper"
                  ].join(" ")}
                >
                  {group.label}
                </Link>
              );
            }
            return (
              <div key={group.key} className="px-1 py-1">
                <p className="px-2 py-1 text-xs font-semibold text-stone-500">{group.label}</p>
                <div className="flex flex-col">
                  {(group.items ?? []).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={[
                        "rounded-md px-3 py-2 text-sm transition",
                        isLinkActive(pathname, item.href)
                          ? "bg-luxas-mist font-medium text-luxas-green"
                          : "text-luxas-ink hover:bg-luxas-paper"
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
