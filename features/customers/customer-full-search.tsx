"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { customerGenderLabels, type Customer, type CustomerGender } from "@/features/customers/types";
import { customersStorageKey, initialCustomers } from "@/features/customers/mock-data";

function birthMonthOf(birthDate: string) {
  const m = /^\d{4}-(\d{2})/.exec(birthDate || "");
  return m ? m[1] : "";
}

function daysSince(dateStr: string) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

export function CustomerFullSearch() {
  const [customers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"" | CustomerGender>("");
  const [membership, setMembership] = useState("");
  const [rank, setRank] = useState("");
  const [tag, setTag] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [customerType, setCustomerType] = useState<"" | "new" | "repeat">("");
  const [lastVisitWithin, setLastVisitWithin] = useState("");

  const results = useMemo(() => {
    const q = (s: string) => s.trim().toLowerCase();
    return customers.filter((c) => {
      if (name && !(`${c.name}${c.nameKana}`.toLowerCase().includes(q(name)))) return false;
      if (phone && !(c.phone ?? "").includes(phone.trim())) return false;
      if (email && !(c.email ?? "").toLowerCase().includes(q(email))) return false;
      if (gender && c.gender !== gender) return false;
      if (membership && !((c.membershipNumber ?? "").includes(membership.trim()))) return false;
      if (rank && !((c.rank ?? "").toLowerCase().includes(q(rank)))) return false;
      if (tag && !c.tags.some((t) => t.toLowerCase().includes(q(tag)))) return false;
      if (birthMonth && birthMonthOf(c.birthDate || c.firstVisitDate) !== birthMonth) return false;
      if (customerType) {
        const visits = Number(c.totalVisits ?? "0") || 0;
        if (customerType === "new" && visits > 1) return false;
        if (customerType === "repeat" && visits <= 1) return false;
      }
      if (lastVisitWithin) {
        const within = Number(lastVisitWithin);
        if (Number.isFinite(within) && daysSince(c.lastVisitAt || c.lastVisitDate) > within) return false;
      }
      return true;
    });
  }, [customers, name, phone, email, gender, membership, rank, tag, birthMonth, customerType, lastVisitWithin]);

  const inputClass = "rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green";

  return (
    <div className="space-y-4">
      <section className="border-b border-luxas-line pb-2">
        <p className="text-sm font-medium text-luxas-green">Customer Full Search</p>
        <h1 className="mt-1 text-xl font-semibold text-luxas-ink">顧客フル検索</h1>
        <p className="mt-1 text-sm text-stone-600">複数条件で顧客を絞り込みます。結果から顧客管理へ移動できます。</p>
      </section>

      <section className="rounded-lg border border-luxas-line bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-stone-600">氏名・カナ<input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">電話<input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">メール<input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">性別
            <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value as CustomerGender | "")}>
              <option value="">すべて</option>
              {(Object.keys(customerGenderLabels) as CustomerGender[]).map((g) => (
                <option key={g} value={g}>{customerGenderLabels[g]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">会員番号<input className={inputClass} value={membership} onChange={(e) => setMembership(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">ランク<input className={inputClass} value={rank} onChange={(e) => setRank(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">タグ<input className={inputClass} value={tag} onChange={(e) => setTag(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">誕生月
            <select className={inputClass} value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
              <option value="">すべて</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                <option key={m} value={m}>{Number(m)}月</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">顧客種別
            <select className={inputClass} value={customerType} onChange={(e) => setCustomerType(e.target.value as "" | "new" | "repeat")}>
              <option value="">すべて</option>
              <option value="new">新規</option>
              <option value="repeat">リピート</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-stone-600">最終来店から○日以内<input className={inputClass} type="number" min="0" value={lastVisitWithin} onChange={(e) => setLastVisitWithin(e.target.value)} /></label>
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-stone-500"><Search size={15} aria-hidden="true" />{results.length}件ヒット</p>
      </section>

      <section className="overflow-x-auto rounded-lg border border-luxas-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
            <tr>
              <th className="px-4 py-3">氏名</th>
              <th className="px-4 py-3">カナ</th>
              <th className="px-4 py-3">性別</th>
              <th className="px-4 py-3">電話</th>
              <th className="px-4 py-3">ランク</th>
              <th className="px-4 py-3">来店回数</th>
              <th className="px-4 py-3">タグ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxas-line">
            {results.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-500">該当する顧客がいません。</td></tr>
            ) : (
              results.map((c) => (
                <tr key={c.id} className="hover:bg-luxas-paper/60">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">
                    <Link href="/dashboard/customers" className="hover:text-luxas-green hover:underline">{c.name}</Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-600">{c.nameKana}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{customerGenderLabels[c.gender]}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{c.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{c.rank || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700">{c.totalVisits ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-700">{c.tags.length ? c.tags.join(" / ") : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
