'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import AIRecapPanel from '@/components/AIRecapPanel.jsx'
import Header from '@/components/Header.jsx'
import HeroMetrics from '@/components/HeroMetrics.jsx'
import HistoryDataGrid from '@/components/HistoryDataGrid.jsx'
import LimitUpGrid from '@/components/LimitUpGrid.jsx'
import { useFeishuData } from '@/hooks/useFeishuData.js'

const SentimentTrendChart = dynamic(() => import('@/components/SentimentTrendChart.jsx'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-sm text-zinc-500">
      加载图表…
    </div>
  ),
})

function normalizeRows(records) {
  return records.map((r) => r.fields)
}

export default function HomePage() {
  const { records, loading, error, dataSource, meta, limitUpRecords } = useFeishuData()

  const rows = useMemo(() => normalizeRows(records), [records])
  const limitUpRows = useMemo(
    () => (limitUpRecords || []).map((r) => r.fields).filter(Boolean),
    [limitUpRecords],
  )

  const latest = useMemo(() => {
    if (!rows.length) return null
    return [...rows]
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
      .at(-1)
  }, [rows])

  return (
    <div className="min-h-screen bg-quant-bg px-4 py-3 text-quant-text">
      <div className="mx-auto max-w-[1920px] space-y-4">
        <Header />

        {error && (
          <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {dataSource === 'mock_fallback'
              ? `飞书接口失败，已回退本地 Mock：${error.message}`
              : `无法拉取数据：${error.message}`}
          </p>
        )}

        {dataSource === 'mock' && meta && !meta.feishuConfigured && (
          <p className="rounded border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            当前未检测到完整的飞书环境变量，使用本地 Mock。缺失：{meta.missingKeys?.join(', ') || '（请检查 .env.local 是否在项目根目录且已重启 dev）'}
          </p>
        )}

        {dataSource === 'mock' && meta?.forceMock && (
          <p className="rounded border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            已设置 FEISHU_USE_MOCK，强制使用本地 Mock。
          </p>
        )}

        {dataSource === 'feishu' && (
          <p className="text-xs text-zinc-500">数据源：飞书多维表格</p>
        )}

        <HeroMetrics latest={loading ? null : latest} />

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                情绪趋势 · 温度 / 涨跌停家数
              </h2>
            </div>
            <SentimentTrendChart rows={loading ? [] : rows} />
          </div>
          <div className="xl:col-span-1">
            <AIRecapPanel recapText={latest?.ai_recap_text} />
          </div>
        </div>

        <LimitUpGrid rows={loading ? [] : limitUpRows} hasZtTable={Boolean(meta?.hasZtTable)} />

        <HistoryDataGrid rows={loading ? [] : rows} />
      </div>
    </div>
  )
}
