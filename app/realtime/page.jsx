"use client"

import { useEffect, useMemo, useState } from "react"
import Header from "@/components/Header.jsx"
import HeroMetrics from "@/components/HeroMetrics.jsx"
import RealtimePoolTable from "@/components/RealtimePoolTable.jsx"
import { useRealtimeMarket } from "@/hooks/useRealtimeMarket.js"
import { INTRADAY_SLOTS, getSuggestedIntradaySlot } from "@/lib/tradingDate.js"

function snapshotToHero(snapshot) {
  if (!snapshot) return null
  return {
    temperature: snapshot.temperature_c,
    zt_count: snapshot.zt_count,
    dt_count: snapshot.dt_count,
    top_stock: snapshot.top_stock,
    top_height: snapshot.top_height,
    cycle_phase: "盘中快照",
    cycle_note: `${snapshot.date} · ${snapshot.slot}`,
  }
}

function formatTime(d) {
  if (!d) return "—"
  const pad = (n) => String(n).padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function RealtimePage() {
  const [slot, setSlot] = useState("09:40")
  const [pollMs, setPollMs] = useState(120_000)

  useEffect(() => {
    setSlot(getSuggestedIntradaySlot())
  }, [])

  const { loading, error, intraday, limitUp, limitDown, lastUpdated, refresh } =
    useRealtimeMarket({
      slot,
      pollMs,
      enabled: true,
    })

  const heroLatest = useMemo(() => {
    const snap = intraday?.snapshot
    if (!snap || intraday?.skipped) return null
    return snapshotToHero(snap)
  }, [intraday])

  const skipped = Boolean(intraday?.skipped)
  const alertInfo = intraday?.alert

  return (
    <div className="min-h-screen bg-quant-bg px-4 py-3 text-quant-text">
      <div className="mx-auto max-w-[1920px] space-y-4">
        <Header />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
            <label className="flex items-center gap-2 text-zinc-400">
              快照槽位
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="rounded border border-white/15 bg-quant-bg px-2 py-1 font-mono text-quant-text"
              >
                {INTRADAY_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-zinc-400">
              轮询间隔
              <select
                value={pollMs}
                onChange={(e) => setPollMs(Number(e.target.value))}
                className="rounded border border-white/15 bg-quant-bg px-2 py-1 text-quant-text"
              >
                <option value={15_000}>15 秒</option>
                <option value={30_000}>30 秒</option>
                <option value={60_000}>60 秒</option>
                <option value={120_000}>2 分钟</option>
              </select>
            </label>
            {loading ? <span className="text-zinc-500">加载中…</span> : null}
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-[11px] text-zinc-500">
              上次刷新 {formatTime(lastUpdated)}
            </span>
            <button
              type="button"
              onClick={() => refresh()}
              className="rounded border border-white/15 bg-white/[0.06] px-3 py-1 text-xs text-zinc-200 hover:bg-white/[0.1]"
            >
              立即刷新
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {skipped && (
          <p className="rounded border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            非交易日：盘中任务已跳过（{intraday?.reason || "weekend"}
            ）。涨跌停池仍可尝试拉取当日接口数据；若数据源无行情则为空。
          </p>
        )}

        {!skipped && intraday?.hint ? (
          <p className="rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[11px] leading-relaxed text-cyan-100/90">
            <span className="font-mono text-cyan-400/90">
              [{intraday?.snapshot_mode || "—"}]
            </span>{" "}
            {intraday.hint}
          </p>
        ) : null}

        {alertInfo?.evaluated && alertInfo?.fired && (
          <p className="rounded border border-red-500/50 bg-red-500/15 px-3 py-2 text-sm text-red-200">
            强预警触发：{alertInfo.reason || "冰点试错信号"}
          </p>
        )}

        <HeroMetrics latest={loading && !heroLatest ? null : heroLatest} />

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <RealtimePoolTable
            title="涨停池（akshare · 东财）"
            rows={limitUp?.ok ? limitUp.rows : []}
            accent="up"
          />
          <RealtimePoolTable
            title="跌停池（akshare · 东财）"
            rows={limitDown?.ok ? limitDown.rows : []}
            accent="down"
          />
        </div>

        <p className="text-[11px] leading-relaxed text-zinc-500">
          配置：在 <code className="font-mono text-zinc-400">.env.local</code>{" "}
          中设置{" "}
          <code className="font-mono text-zinc-400">
            MARKET_SKILLS_API_BASE
          </code>
          （如{" "}
          <code className="font-mono text-zinc-400">http://127.0.0.1:8787</code>
          ）指向已启动的 market-skills；若对方启用了{" "}
          <code className="font-mono text-zinc-400">INTRADAY_API_SECRET</code>
          ，请同步设置{" "}
          <code className="font-mono text-zinc-400">
            MARKET_SKILLS_API_SECRET
          </code>
          。
        </p>
      </div>
    </div>
  )
}
