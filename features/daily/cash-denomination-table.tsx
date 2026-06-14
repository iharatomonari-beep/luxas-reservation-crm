"use client";

const DENOMINATIONS = [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1];

export type CashCounts = Record<string, number>;

export function cashTotal(counts: CashCounts): number {
  return DENOMINATIONS.reduce((sum, d) => sum + d * (counts[String(d)] || 0), 0);
}

export function CashDenominationTable({
  counts,
  onChange
}: {
  counts: CashCounts;
  onChange: (counts: CashCounts) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-luxas-line">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
          <tr>
            <th className="px-3 py-2">金種</th>
            <th className="px-3 py-2">本数/枚数</th>
            <th className="px-3 py-2 text-right">小計</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-luxas-line">
          {DENOMINATIONS.map((d) => {
            const count = counts[String(d)] || 0;
            return (
              <tr key={d}>
                <td className="whitespace-nowrap px-3 py-1.5 font-medium text-luxas-ink">¥{d.toLocaleString()}</td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min="0"
                    value={count}
                    onChange={(event) => onChange({ ...counts, [String(d)]: Math.max(0, Number(event.target.value) || 0) })}
                    className="w-24 rounded border border-luxas-line bg-white px-2 py-1 text-sm outline-none focus:border-luxas-green"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right text-stone-700">¥{(d * count).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-luxas-line bg-luxas-paper">
            <td className="px-3 py-2 font-semibold text-luxas-ink" colSpan={2}>合計</td>
            <td className="px-3 py-2 text-right font-semibold text-luxas-ink">¥{cashTotal(counts).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
