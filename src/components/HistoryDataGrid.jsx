import { useMemo, useState } from 'react'

function parseDate(s) {
  if (s == null || s === '') return 0
  const [y, m, d] = String(s).split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return 0
  return new Date(y, m - 1, d).getTime()
}

/**
 * @param {{ rows: Array, className?: string }} props
 */
export default function HistoryDataGrid({ rows, className = '' }) {
  const [order, setOrder] = useState('desc')

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const ta = parseDate(a.date)
      const tb = parseDate(b.date)
      return order === 'asc' ? ta - tb : tb - ta
    })
    return copy
  }, [rows, order])

  const toggleDateSort = () => {
    setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
  }

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 ${className}`}
    >
      <div className="shrink-0 border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          历史明细（近 15 日）
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead className="sticky top-0 z-10 bg-quant-bg shadow-[0_1px_0_rgba(255,255,255,0.08)]">
            <tr className="text-zinc-400">
              <th className="whitespace-nowrap border-b border-white/10 px-3 py-2">
                <button
                  type="button"
                  onClick={toggleDateSort}
                  className="inline-flex items-center gap-1 font-medium text-zinc-300 hover:text-quant-text"
                >
                  日期
                  <span className="text-[10px] text-zinc-500" aria-hidden>
                    {order === 'asc' ? '↑' : '↓'}
                  </span>
                </button>
              </th>
              <th className="whitespace-nowrap border-b border-white/10 px-3 py-2">温度</th>
              <th className="whitespace-nowrap border-b border-white/10 px-3 py-2">涨停</th>
              <th className="whitespace-nowrap border-b border-white/10 px-3 py-2">跌停</th>
              <th className="whitespace-nowrap border-b border-white/10 px-3 py-2">最高连板</th>
              <th className="whitespace-nowrap border-b border-white/10 px-3 py-2">空间龙</th>
              <th className="min-w-[140px] border-b border-white/10 px-3 py-2">AI 周期判定</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr
                key={r.date}
                className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.03]'}
              >
                <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-zinc-300">
                  {r.date}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-amber-500">
                  {Number(r.temperature).toFixed(1)}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-red-500">
                  {r.zt_count}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-green-500">
                  {r.dt_count}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-zinc-300">
                  {r.top_height}
                </td>
                <td className="max-w-[120px] truncate px-3 py-1.5 text-zinc-300" title={r.top_stock}>
                  {r.top_stock}
                </td>
                <td className="px-3 py-1.5 text-zinc-400">{r.cycle_phase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
