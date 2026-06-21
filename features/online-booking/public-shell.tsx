"use client";

// PM（PeakManager）公開予約サイト相当の共通ヘッダー／外枠。
// 認証なしの公開ページ（/book/[storeId] 以下）で共有する。
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Hand, Home, MapPin, User } from "lucide-react";
import { initialStores } from "@/features/org/mock-data";
import { useMemberSession } from "@/features/online-booking/use-member-session";

// PM のヘッダー／プライマリボタンに使われている濃紺。
export const PM_NAVY = "#1f2a44";

export function PublicHeader({ storeId }: { storeId: string }) {
  const pathname = usePathname();
  const { memberId } = useMemberSession();
  const base = `/book/${storeId}`;
  const store = initialStores.find((s) => s.id === storeId);
  const loggedIn = Boolean(memberId);
  const onMyPage = pathname.startsWith(`${base}/mypage`);

  const items = [
    { href: base, label: "ホーム", icon: Home, active: pathname === base },
    { href: `${base}/reserve`, label: "予約", icon: CalendarCheck, active: pathname.startsWith(`${base}/reserve`) },
    { href: `${base}/menu`, label: "メニュー", icon: Hand, active: pathname.startsWith(`${base}/menu`) },
    { href: `${base}/map`, label: "マップ", icon: MapPin, active: pathname.startsWith(`${base}/map`) }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-luxas-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href={base} className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[9px] font-bold leading-none text-white"
            style={{ backgroundColor: PM_NAVY }}
          >
            LUXAS
          </span>
          <span className="truncate text-sm font-bold text-luxas-ink sm:text-lg">{store?.name ?? "LUXAS"}</span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-2">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  "flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-medium sm:text-[11px]",
                  it.active ? "text-luxas-ink" : "text-stone-400 hover:text-stone-600"
                ].join(" ")}
              >
                <span className={it.active ? "rounded-md p-1 ring-1 ring-luxas-line" : "p-1"}>
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <span className={it.active ? "border-b-2 border-luxas-ink pb-0.5" : "pb-0.5"}>{it.label}</span>
              </Link>
            );
          })}
          <Link
            href={loggedIn ? `${base}/mypage` : `${base}#login`}
            className={[
              "ml-1 flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] font-semibold text-white sm:text-[11px]",
              onMyPage ? "ring-2 ring-luxas-ink ring-offset-1" : ""
            ].join(" ")}
            style={{ backgroundColor: PM_NAVY }}
          >
            <User size={18} strokeWidth={1.8} />
            <span>{loggedIn ? "マイページ" : "ログイン"}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
