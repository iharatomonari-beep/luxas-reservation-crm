// 経費マスタ・日次管理のデータ型と初期値（T027）

export type ExpenseAccount = {
  id: string;
  name: string;
  subName: string;
  sortOrder: number;
  isActive: boolean;
};

export type ExpenseEntry = {
  id: string;
  /** 店舗スコープ（非破壊・任意）。未設定の既存データは既定店舗扱い。 */
  storeId?: string;
  date: string;
  accountId: string;
  amount: number;
  note: string;
  /** 何月分か（YYYY-MM） */
  targetMonth: string;
};

export type AttendanceRecord = {
  id: string; // `${date}:${storeId}:${staffId}`（旧データは `${date}:${staffId}`）
  /** 店舗スコープ（非破壊・任意）。未設定の既存データは既定店舗扱い。 */
  storeId?: string;
  date: string;
  staffId: string;
  clockIn: string;
  clockOut: string;
};

export type RegisterRecord = {
  id: string; // `${date}:${storeId}:${kind}`（旧データは `${date}:${kind}`）
  /** 店舗スコープ（非破壊・任意）。未設定の既存データは既定店舗扱い。 */
  storeId?: string;
  date: string;
  kind: "open" | "check" | "close";
  counts: Record<string, number>;
  memo: string;
};

export const expenseAccountsStorageKey = "luxas-expense-accounts";
export const expenseEntriesStorageKey = "luxas-expense-entries";
export const attendanceStorageKey = "luxas-attendance";
export const registerStorageKey = "luxas-register-records";

export const initialExpenseAccounts: ExpenseAccount[] = [
  { id: "acc-001", name: "消耗品費", subName: "備品", sortOrder: 10, isActive: true },
  { id: "acc-002", name: "水道光熱費", subName: "電気", sortOrder: 20, isActive: true },
  { id: "acc-003", name: "広告宣伝費", subName: "Web", sortOrder: 30, isActive: true },
  { id: "acc-004", name: "地代家賃", subName: "店舗", sortOrder: 40, isActive: true }
];
