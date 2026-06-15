"use client";

import { MasterPage } from "@/features/master-data/master-page";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { compareBySortOrder } from "@/features/master-data/utils";

type UserRecord = { id: string; userName: string; loginId: string; sortOrder: number; lastLoginAt: string };
const usersStorageKey = "luxas-users";
const initialUsers: UserRecord[] = [
  { id: "user-001", userName: "店長アカウント", loginId: "manager", sortOrder: 10, lastLoginAt: "2026-06-15 08:30" },
  { id: "user-002", userName: "受付アカウント", loginId: "reception", sortOrder: 20, lastLoginAt: "2026-06-14 19:05" }
];

export function UsersMaster() {
  const [users] = useLocalCollection<UserRecord>(usersStorageKey, initialUsers);
  const rows = [...users].sort(compareBySortOrder);

  return (
    <MasterPage title="ユーザマスタ" description="ログインユーザーを一覧します（表示のみ・パスワード/認証/権限はここでは変更しません）。">
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        ※ 認証・権限・パスワードの変更は行いません（表示のみ）。
      </div>
      <section className="overflow-x-auto rounded-lg border border-luxas-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">ユーザ名</th>
              <th className="px-4 py-3">ログインID</th>
              <th className="px-4 py-3">表示順</th>
              <th className="px-4 py-3">最終ログイン</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxas-line">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-400">{u.id.slice(0, 8)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-luxas-ink">{u.userName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-700">{u.loginId}</td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-700">{u.sortOrder}</td>
                <td className="whitespace-nowrap px-4 py-3 text-stone-700">{u.lastLoginAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </MasterPage>
  );
}
