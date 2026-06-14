import { ReactNode } from "react";

export function MasterPage({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-luxas-line pb-5">
        <p className="text-sm font-medium text-luxas-green">Master Data</p>
        <h1 className="mt-2 text-2xl font-semibold text-luxas-ink">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
      ].join(" ")}
    >
      {isActive ? "有効" : "無効"}
    </span>
  );
}
