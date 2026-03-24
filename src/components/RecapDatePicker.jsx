'use client'

/**
 * 复盘视角切换：自动（今日优先 → 否则最新）或指定交易日。
 */
export default function RecapDatePicker({ value, onChange, dateKeys, loading, disabled }) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
      <span className="shrink-0 font-medium uppercase tracking-wider text-zinc-500">
        复盘日期
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || disabled}
        className="max-w-[min(100%,280px)] rounded border border-white/15 bg-quant-bg px-2 py-1.5 font-mono text-xs text-quant-text hover:border-white/25 focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
      >
        <option value="auto">自动（优先今日，否则最新一日）</option>
        {dateKeys.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </label>
  )
}
