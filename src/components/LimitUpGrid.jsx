/**
 * @param {{ className?: string, scrollClassName?: string }} props
 * scrollClassName：表体滚动区域 class，单屏布局时传 max-h-full 等
 */
export default function LimitUpGrid({
  rows,
  hasZtTable,
  alignedDate,
  filterNotice,
  className = '',
  scrollClassName = '',
}) {
  if (!rows?.length) {
    return (
      <section className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 ${className}`}>
        <div className="border-b border-white/10 bg-white/[0.04] px-3 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            涨停数据明细（飞书）
            {alignedDate ? (
              <span className="ml-2 font-mono text-[11px] font-normal text-amber-500/90">
                · 对齐 {alignedDate}
              </span>
            ) : null}
          </h2>
        </div>
        <p className="px-3 py-4 text-xs text-zinc-500">
          {!hasZtTable
            ? '未配置涨停表：在 .env 中设置 FEISHU_BITABLE_TABLE_ID_ZT 为涨停数据表的 table_id，并重启 dev。'
            : filterNotice ||
              '该表中暂无记录，或列名与预期不一致（需包含：股票代码、股票名称等）。'}
        </p>
      </section>
    )
  }

  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 ${className}`}>
      <div className="border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          涨停数据明细
          {alignedDate ? (
            <span className="ml-2 font-mono text-[11px] font-normal text-amber-500/90">
              · 交易日 {alignedDate}
            </span>
          ) : null}
          <span className="ml-2 text-zinc-500">（{rows.length} 条）</span>
        </h2>
        {filterNotice ? (
          <p className="mt-1.5 text-[11px] leading-snug text-amber-200/80">{filterNotice}</p>
        ) : null}
      </div>
      <div className={`min-h-0 flex-1 overflow-auto ${scrollClassName}`}>
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead className="sticky top-0 z-10 bg-quant-bg shadow-[0_1px_0_rgba(255,255,255,0.08)]">
            <tr className="text-zinc-400">
              <th className="border-b border-white/10 px-2 py-1.5">代码</th>
              <th className="border-b border-white/10 px-2 py-1.5">名称</th>
              <th className="border-b border-white/10 px-2 py-1.5">所属行业</th>
              <th className="border-b border-white/10 px-2 py-1.5">涨跌幅</th>
              <th className="border-b border-white/10 px-2 py-1.5">最新价</th>
              <th className="border-b border-white/10 px-2 py-1.5">连板</th>
              <th className="border-b border-white/10 px-2 py-1.5">成交额</th>
              <th className="border-b border-white/10 px-2 py-1.5">换手</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.record_id || i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.03]'}>
                <td className="whitespace-nowrap px-2 py-1.5 text-zinc-300">{r.stock_code}</td>
                <td className="max-w-[120px] truncate px-2 py-1.5 text-zinc-300" title={r.stock_name}>
                  {r.stock_name}
                </td>
                <td
                  className="max-w-[100px] truncate px-2 py-1.5 text-zinc-400"
                  title={r.industry || ''}
                >
                  {r.industry != null && String(r.industry).trim() !== '' ? r.industry : '—'}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-red-500">
                  {r.pct_change != null && r.pct_change !== '' ? `${Number(r.pct_change).toFixed(2)}%` : '—'}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-zinc-300">
                  {r.latest_price != null && r.latest_price !== '' ? Number(r.latest_price).toFixed(2) : '—'}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-amber-500">
                  {r.board_count != null && r.board_count !== '' ? r.board_count : '—'}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-zinc-400">
                  {r.turnover != null && r.turnover !== '' ? Number(r.turnover).toFixed(0) : '—'}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-zinc-400">
                  {r.turnover_rate != null && r.turnover_rate !== ''
                    ? `${Number(r.turnover_rate).toFixed(2)}%`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
