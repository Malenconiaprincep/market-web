function tempClass(t) {
  if (t > 80) return 'text-red-500'
  if (t < 20) return 'text-quant-ice'
  return 'text-amber-500'
}

export default function HeroMetrics({ latest }) {
  if (!latest) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-4 animate-pulse"
          >
            <div className="h-20 rounded bg-white/10" />
          </div>
        ))}
      </div>
    )
  }

  const t = Number(latest.temperature)
  const tValid = Number.isFinite(t)
  const zt = latest.zt_count
  const dt = latest.dt_count

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          情绪温度
        </h2>
        <p className={`mt-1 text-4xl font-bold tabular-nums ${tValid ? tempClass(t) : 'text-zinc-500'}`}>
          {tValid ? `${t.toFixed(1)}°C` : '—'}
        </p>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          涨跌停家数
        </h2>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-500">涨停</span>
            <p className="text-3xl font-bold tabular-nums text-red-500">{zt}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-500">跌停</span>
            <p className="text-3xl font-bold tabular-nums text-green-500">{dt}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          空间龙
        </h2>
        <p className="mt-2 text-xl font-semibold leading-snug text-quant-text">
          {latest.top_stock}
          <span className="text-zinc-400"> — </span>
          <span className="text-amber-500">{latest.top_height}连板</span>
        </p>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          周期阶段
        </h2>
        <p className="mt-1 text-2xl font-bold text-quant-text">{latest.cycle_phase}</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{latest.cycle_note}</p>
      </section>
    </div>
  )
}
