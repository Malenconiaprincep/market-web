'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** 代理返回 502/503 时可能带 upstream、hint */
function formatProxyError(data, fallback) {
  if (!data || typeof data !== 'object') return fallback
  const parts = [
    data.error,
    data.upstream && `目标 ${data.upstream}`,
    data.hint,
  ].filter(Boolean)
  return parts.length ? parts.join(' — ') : fallback
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: text ? text.slice(0, 240) : 'invalid response' }
  }
  return { res, data }
}

/**
 * 轮询 market-skills 代理：盘中快照 + 涨跌停池（同一交易日）。
 * @param {{ slot: string, pollMs: number, enabled?: boolean }} opts
 */
export function useRealtimeMarket({ slot, pollMs, enabled = true }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [intraday, setIntraday] = useState(null)
  const [limitUp, setLimitUp] = useState(null)
  const [limitDown, setLimitDown] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const seq = useRef(0)

  const load = useCallback(async () => {
    const my = ++seq.current
    setError(null)
    setLoading(true)
    const intradayUrl = `/api/market-skills/intraday?slot=${encodeURIComponent(slot)}`
    const { res, data } = await fetchJson(intradayUrl)
    if (my !== seq.current) return

    if (!res.ok) {
      setIntraday(data)
      setLimitUp(null)
      setLimitDown(null)
      setError(formatProxyError(data, `盘中接口 HTTP ${res.status}`))
      setLoading(false)
      setLastUpdated(new Date())
      return
    }

    setIntraday(data)

    if (data?.ok === false && !data?.skipped) {
      setLimitUp(null)
      setLimitDown(null)
      setError(data?.error || '盘中任务失败')
      setLoading(false)
      setLastUpdated(new Date())
      return
    }

    const date = data?.snapshot?.date
    const canPool =
      data?.ok &&
      !data?.skipped &&
      date &&
      typeof date === 'string' &&
      date.length === 8

    if (canPool) {
      const q = `?date=${encodeURIComponent(date)}`
      const [upR, downR] = await Promise.all([
        fetchJson(`/api/market-skills/limit_up${q}`),
        fetchJson(`/api/market-skills/limit_down${q}`),
      ])
      if (my !== seq.current) return
      setLimitUp(upR.data)
      setLimitDown(downR.data)
      if (!upR.res.ok) {
        setError(formatProxyError(upR.data, `涨停池 HTTP ${upR.res.status}`))
      } else if (!downR.res.ok) {
        setError(formatProxyError(downR.data, `跌停池 HTTP ${downR.res.status}`))
      } else {
        setError(null)
      }
    } else {
      setLimitUp(null)
      setLimitDown(null)
      setError(null)
    }

    setLoading(false)
    setLastUpdated(new Date())
  }, [slot])

  useEffect(() => {
    if (!enabled) return undefined
    const t0 = setTimeout(() => {
      load()
    }, 0)
    const id = setInterval(() => {
      load()
    }, pollMs)
    return () => {
      clearTimeout(t0)
      clearInterval(id)
    }
  }, [enabled, load, pollMs])

  return {
    loading,
    error,
    intraday,
    limitUp,
    limitDown,
    lastUpdated,
    refresh: load,
  }
}
