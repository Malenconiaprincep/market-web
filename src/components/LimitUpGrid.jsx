export default function LimitUpGrid({ rows, hasZtTable }) {
  if (!rows?.length) {
    return (
      <section className="overflow-hidden rounded-lg border border-white/10">
        <div className="border-b border-white/10 bg-white/[0.04] px-3 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            涨停数据明细（飞书）
          </h2>
        </div>
        <p className="px-3 py-4 text-xs text-zinc-500">
          {hasZtTable
            ? '该表中暂无记录，或列名与预期不一致（需包含：股票代码、股票名称、涨跌幅等）。'
            : '未配置涨停表：在 .env 中设置 FEISHU_BITABLE_TABLE_ID_ZT 为涨停数据表的 table_id，并重启 dev。'}
        </p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-lg border border-white/10">
      <div className="border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          涨停数据明细（{rows.length} 条）
        </h2>
      </div>
      <div className="max-h-[320px] overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-[11px]">
          <thead className="sticky top-0 bg-quant-bg">
            <tr className="text-zinc-400">
              <th className="border-b border-white/10 px-2 py-1.5">代码</th>
              <th className="border-b border-white/10 px-2 py-1.5">名称</th>
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
