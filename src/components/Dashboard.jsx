'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

import { buildIndustryLookupFromAkshareRows, normalizeAStockCode } from '@/lib/limitUpIndustry.js'
import AIRecapPanel from '@/components/AIRecapPanel.jsx'
import DataDateStrip from '@/components/DataDateStrip.jsx'
import Header from '@/components/Header.jsx'
import HeroMetrics from '@/components/HeroMetrics.jsx'
import HistoryDataGrid from '@/components/HistoryDataGrid.jsx'
import LimitUpGrid from '@/components/LimitUpGrid.jsx'
import RecapDatePicker from '@/components/RecapDatePicker.jsx'
import { useDashboardEngine } from '@/hooks/useDashboardEngine.js'
import {
  filterLimitUpRowsBySnapshotDate,
  findSnapshotRowByDateKey,
  getTodayYmdShanghai,
  listSortedDateKeys,
  normalizeDateKey,
  pickSnapshotRow,
} from '@/lib/tradingDate.js'

const SentimentTrendChart = dynamic(() => import('@/components/SentimentTrendChart.jsx'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[160px] flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-sm text-zinc-500">
      加载图表…
    </div>
  ),
})

function normalizeRows(records) {
  return records.map((r) => r.fields)
}

/**
 * 量化看板（xl+ 四宫格）：
 * 上行：情绪图 | 涨停明细
 * 下行：AI 复盘 | 历史明细
 * 表格仅在各自块内滚动，避免整页拉长。
 */
export default function Dashboard() {
  const {
    records: recordItems,
    limitUpRecords,
    loading,
    error,
    dataSource,
    meta,
    refetch,
    heroFromEngine,
    realtime,
  } = useDashboardEngine()

  const rows = useMemo(() => normalizeRows(recordItems), [recordItems])
  const limitUpRows = useMemo(
    () => (limitUpRecords || []).map((r) => r.fields).filter(Boolean),
    [limitUpRecords],
  )

  /** auto：沿用 pickSnapshotRow；否则按所选交易日取情绪行 */
  const [recapDateMode, setRecapDateMode] = useState('auto')

  const dateKeys = useMemo(() => listSortedDateKeys(rows), [rows])

  useEffect(() => {
    if (recapDateMode !== 'auto' && !dateKeys.includes(recapDateMode)) {
      setRecapDateMode('auto')
    }
  }, [dateKeys, recapDateMode])

  const snapshot = useMemo(() => {
    if (recapDateMode !== 'auto') {
      const found = findSnapshotRowByDateKey(rows, recapDateMode)
      if (found) return found
    }
    return pickSnapshotRow(rows)
  }, [rows, recapDateMode])

  const viewingToday = useMemo(() => {
    if (!snapshot?.date) return false
    return normalizeDateKey(snapshot.date) === getTodayYmdShanghai()
  }, [snapshot])

  const isTodaySnapshot = viewingToday

  const limitUpDisplay = useMemo(
    () => filterLimitUpRowsBySnapshotDate(limitUpRows, snapshot?.date, isTodaySnapshot),
    [limitUpRows, snapshot?.date, isTodaySnapshot],
  )

  /** 与 market-skills ak.stock_zt_pool_em 同源：按当前复盘日拉 /api/limit_up，补全「所属行业」 */
  const [industryByCode, setIndustryByCode] = useState(() => new Map())

  useEffect(() => {
    const target = normalizeDateKey(snapshot?.date)
    if (!target) {
      setIndustryByCode(new Map())
      return
    }
    const ymd = target.replace(/-/g, '')
    let cancelled = false
    fetch(`/api/market-skills/limit_up?date=${encodeURIComponent(ymd)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((j) => {
        if (cancelled || !j?.ok || !Array.isArray(j.rows)) return
        setIndustryByCode(buildIndustryLookupFromAkshareRows(j.rows))
      })
      .catch(() => {
        if (!cancelled) setIndustryByCode(new Map())
      })
    return () => {
      cancelled = true
    }
  }, [snapshot?.date])

  const limitUpRowsForGrid = useMemo(() => {
    const rows = limitUpDisplay.rows
    if (!rows?.length || industryByCode.size === 0) return rows
    return rows.map((r) => {
      const hasFeishu = r.industry != null && String(r.industry).trim() !== ''
      if (hasFeishu) return r
      const code = normalizeAStockCode(r.stock_code)
      const ind = code ? industryByCode.get(code) : null
      if (ind == null || ind === '') return r
      return { ...r, industry: ind }
    })
  }, [limitUpDisplay.rows, industryByCode])

  /** 仅当当前展示日为「今日」时用盘中引擎覆盖 Hero；回看历史日只用飞书/Mock 行 */
  const heroLatest = useMemo(() => {
    if (loading && !heroFromEngine) return null
    if (heroFromEngine && viewingToday) return heroFromEngine
    return snapshot
  }, [loading, heroFromEngine, snapshot, viewingToday])

  const sourceHint =
    dataSource === 'feishu_via_engine'
      ? '历史：经引擎读飞书 · 涨停表：Next 直连飞书'
      : dataSource === 'feishu'
        ? '数据源：飞书多维表格'
        : null

  return (
    <div className="flex min-h-dvh flex-col bg-quant-bg px-3 py-2 text-quant-text sm:px-4 xl:h-[100dvh] xl:max-h-[100dvh] xl:overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-2 xl:min-h-0">
        <div className="shrink-0">
          <Header />
        </div>

        {error && (
          <p className="shrink-0 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {dataSource === 'mock_fallback'
              ? `飞书接口失败，已回退本地 Mock：${error.message}`
              : `无法拉取数据：${error.message}`}
          </p>
        )}

        {dataSource === 'mock' && meta && !meta.feishuConfigured && (
          <p className="shrink-0 rounded border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            当前未检测到完整的飞书环境变量，使用本地 Mock。缺失：
            {meta.missingKeys?.join(', ') || '（请检查 .env.local 是否在项目根目录且已重启 dev）'}
          </p>
        )}

        {dataSource === 'mock' && meta?.forceMock && (
          <p className="shrink-0 rounded border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            已设置 FEISHU_USE_MOCK，强制使用本地 Mock。
          </p>
        )}

        {sourceHint && (
          <p className="shrink-0 text-[11px] text-zinc-500">{sourceHint}</p>
        )}

        {heroFromEngine && (
          <p className="shrink-0 rounded border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200/90">
            盘中 Hero 来自实时引擎
            {realtime?.updated_at ? (
              <span className="ml-2 font-mono text-cyan-500/80">{realtime.updated_at}</span>
            ) : null}
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 rounded border border-white/15 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-white/10"
            >
              刷新复盘
            </button>
          </p>
        )}

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <RecapDatePicker
            value={recapDateMode}
            onChange={setRecapDateMode}
            dateKeys={dateKeys}
            loading={loading}
          />
          <div className="min-w-0 flex-1 sm:flex sm:justify-end">
            <DataDateStrip date={snapshot?.date} loading={loading} isToday={isTodaySnapshot} compact />
          </div>
        </div>

        <div className="shrink-0">
          <HeroMetrics latest={heroLatest} />
        </div>

        {/* 主内容：2×2 块对齐 — 上行 图|涨停，下行 复盘|历史 */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden xl:min-h-[200px]">
          {/* 上行：图表 | 涨停明细（原「今日复盘」位改为涨停表，与左侧图同高对齐） */}
          <section className="grid shrink-0 grid-cols-1 gap-2 overflow-hidden xl:grid-cols-12 xl:items-stretch">
            <div className="flex min-h-[200px] flex-col overflow-hidden xl:col-span-7 xl:h-[min(42vh,480px)] xl:min-h-[240px]">
              <h2 className="mb-1 shrink-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                情绪趋势 · 温度 / 涨跌停家数
              </h2>
              <div className="min-h-0 flex-1 overflow-hidden">
                <SentimentTrendChart rows={loading ? [] : rows} fill />
              </div>
            </div>
            <div className="flex min-h-[200px] flex-col overflow-hidden xl:col-span-5 xl:h-[min(42vh,480px)] xl:min-h-[240px]">
              <LimitUpGrid
                rows={loading ? [] : limitUpRowsForGrid}
                hasZtTable={Boolean(meta?.hasZtTable)}
                alignedDate={snapshot?.date}
                filterNotice={limitUpDisplay.notice}
                className="h-full min-h-0"
              />
            </div>
          </section>

          {/* 下行：AI 复盘 | 历史明细（占满剩余高度，两列等高） */}
          <section className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden xl:grid-cols-12 xl:items-stretch">
            <div className="flex min-h-[200px] flex-col overflow-hidden xl:col-span-7 xl:h-full xl:min-h-0">
              <AIRecapPanel
                recapText={snapshot?.ai_recap_text}
                useMarkdown
                variant="fill"
                className="h-full min-h-0 shadow-none"
                title={
                  isTodaySnapshot
                    ? '今日复盘 · AI 深度复盘'
                    : '游资视点 · AI 深度复盘'
                }
              />
            </div>
            <div className="flex min-h-[200px] flex-col overflow-hidden xl:col-span-5 xl:h-full xl:min-h-0">
              <HistoryDataGrid rows={loading ? [] : rows} className="h-full min-h-0" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
