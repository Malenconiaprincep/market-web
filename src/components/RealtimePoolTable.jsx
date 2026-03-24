const PRIORITY_KEYS = [
  '代码',
  '名称',
  '涨跌幅',
  '最新价',
  '连板数',
  '成交额',
  '换手率',
  '流通市值',
  '封板资金',
  '所属行业',
]

function pickColumns(rows) {
  const first = rows?.[0]
  if (!first || typeof first !== 'object') return []
  const keys = Object.keys(first)
  const ordered = [
    ...PRIORITY_KEYS.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !PRIORITY_KEYS.includes(k)),
  ]
  return ordered.slice(0, 10)
}

function formatCell(v) {
  if (v == null || v === '') return '—'
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (Math.abs(v) >= 1000 && Number.isInteger(v)) return String(v)
    return Number.isInteger(v) ? String(v) : v.toFixed(2)
  }
  return String(v)
}

export default function RealtimePoolTable({ title, rows, accent }) {
  const cols = pickColumns(rows || [])
  if (!rows?.length || !cols.length) {
    return (
      <section className="overflow-hidden rounded-lg border border-white/10">
        <div className="border-b border-white/10 bg-white/[0.04] px-3 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
        </div>
        <p className="px-3 py-4 text-xs text-zinc-500">暂无数据</p>
      </section>
    )
  }

  const borderAccent =
    accent === 'up' ? 'border-red-500/20' : accent === 'down' ? 'border-green-500/20' : 'border-white/10'

  return (
    <section className={`overflow-hidden rounded-lg border ${borderAccent}`}>
      <div className="border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {title}
          <span className="ml-2 text-zinc-500">（{rows.length} 条）</span>
        </h2>
      </div>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead className="sticky top-0 bg-quant-bg">
            <tr className="text-zinc-400">
              {cols.map((c) => (
                <th key={c} className="border-b border-white/10 px-2 py-1.5 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.03]'}>
                {cols.map((c) => (
                  <td
                    key={c}
                    className="max-w-[140px] truncate border-b border-white/5 px-2 py-1.5 text-zinc-300"
                    title={formatCell(r[c])}
                  >
                    {formatCell(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
