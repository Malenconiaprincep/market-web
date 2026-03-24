'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { buildBitableRecordsFromMock } from '@/lib/mockBitable.js'
import { getTodayYmdShanghai } from '@/lib/tradingDate.js'

const SEEN_KEY = 'quant_alert_seen_ids'

function loadSeenIds() {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveSeenIds(set) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...set].slice(-500)))
  } catch {
    /* ignore */
  }
}

/** 将引擎 realtime 映射为 HeroMetrics 所需字段 */
export function realtimeToHeroShape(rt) {
  if (!rt) return null
  return {
    temperature: rt.temp,
    zt_count: rt.zt,
    dt_count: rt.dt,
    top_stock: rt.top_stock ?? '—',
    top_height: rt.top_height,
    cycle_phase: rt.cycle_phase ?? '—',
    cycle_note: rt.cycle_note ?? '',
  }
}

/**
 * 复盘页数据引擎：优先 market-skills 的 history；涨停明细始终尝试飞书 bitable。
 * 失败则回退原 /api/bitable-records 全量数据。
 */
export function useDashboardEngine() {
  const [records, setRecords] = useState([])
  const [limitUpRecords, setLimitUpRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState(null)
  const [meta, setMeta] = useState(null)
  const [realtime, setRealtime] = useState(null)
  const [engineAlerts, setEngineAlerts] = useState([])
  const seenAlertIdsRef = useRef(typeof window !== 'undefined' ? loadSeenIds() : new Set())
  const alertBootRef = useRef(true)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const h = await fetch('/api/market-skills/history', { cache: 'no-store' })
      const hj = await h.json()
      const engineOk = h.ok && hj.ok && Array.isArray(hj.records)

      if (engineOk) {
        setRecords(hj.records)
        setDataSource('feishu_via_engine')
      }

      const bitable = await fetch('/api/bitable-records', { cache: 'no-store' })
      const bj = await bitable.json()
      if (!bitable.ok) {
        throw new Error(bj.error || `bitable HTTP ${bitable.status}`)
      }

      setLimitUpRecords(Array.isArray(bj.limitUpRecords) ? bj.limitUpRecords : [])
      setMeta(bj.meta ?? null)

      if (!engineOk) {
        setRecords(Array.isArray(bj.records) ? bj.records : [])
        setDataSource(bj.source ?? null)
      }

      if (bj.source === 'mock_fallback' && bj.error) {
        setError(new Error(bj.error))
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
      setRecords(buildBitableRecordsFromMock().map((fields) => ({ record_id: 'mock', fields })))
      setLimitUpRecords([])
      setDataSource('mock')
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const pollRealtime = useCallback(async () => {
    try {
      const r = await fetch('/api/market-skills/realtime', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok || !j.ok) return
      setRealtime(j.realtime ?? null)
      const alerts = Array.isArray(j.alerts) ? j.alerts : []
      setEngineAlerts(alerts)

      const seen = seenAlertIdsRef.current
      if (alertBootRef.current) {
        alertBootRef.current = false
        for (const a of alerts) {
          if (a?.id) seen.add(a.id)
        }
        saveSeenIds(seen)
        return
      }
      for (const a of alerts) {
        const id = a?.id
        if (id && !seen.has(id)) {
          seen.add(id)
          toast.error(a.title || '盘中预警', {
            description: a.body || '',
            duration: 12_000,
          })
        }
      }
      saveSeenIds(seen)
    } catch {
      /* 引擎未启动时静默 */
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    pollRealtime()
    const id = setInterval(pollRealtime, 10_000)
    return () => clearInterval(id)
  }, [pollRealtime])

  const heroFromEngine = useMemo(() => {
    const rt = realtime
    if (!rt || !rt.date) return null
    const today = getTodayYmdShanghai().replace(/-/g, '')
    if (String(rt.date) !== today) return null
    return realtimeToHeroShape(rt)
  }, [realtime])

  return {
    records,
    limitUpRecords,
    loading,
    error,
    dataSource,
    meta,
    refetch: loadHistory,
    realtime,
    heroFromEngine,
    engineAlerts,
  }
}
