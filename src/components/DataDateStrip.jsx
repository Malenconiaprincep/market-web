/**
 * 标明当前 Hero / 复盘 / 涨停明细所对应的「数据交易日」
 */
export default function DataDateStrip({ date, loading, isToday }) {
  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="text-xs text-zinc-500">数据日期加载中…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        数据日期
      </span>
      {isToday && (
        <span className="rounded border border-red-500/50 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
          今日
        </span>
      )}
      <span className="font-mono text-xl font-bold tabular-nums tracking-tight text-amber-500">
        {date ?? '—'}
      </span>
      {date ? (
        <span className="text-xs text-zinc-500">
          {isToday
            ? '当前展示今日收盘快照：指标与右侧为「今日复盘」文案（情绪表中需有今日日期行）。'
            : '上方指标、AI 复盘与涨停明细均对应该交易日（北京时间）；若存在「今日」行将自动切换为今日复盘。'}
        </span>
      ) : (
        <span className="text-xs text-zinc-500">
          未解析到「日期」列时，将用记录创建时间推断；建议在飞书情绪表中保留「日期」列。
        </span>
      )}
    </div>
  )
}
