import { useCallback, useEffect, useState } from 'react'
import { buildBitableRecordsFromMock } from '@/lib/mockBitable.js'

/**
 * 浏览器端调用 Next 服务端 API（凭证仅在服务端 env，勿用 NEXT_PUBLIC_ 存 Secret）
 */
export async function fetchRealDataFromFeishu() {
  const res = await fetch('/api/bitable-records', { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  const json = await res.json()
  if (json.source === 'mock_fallback' && json.error) {
    throw new Error(json.error)
  }
  if (json.error) {
    throw new Error(json.error)
  }
  return json.records
}

/**
 * @returns {{
 *   records: Array<{ record_id: string, fields: Record<string, unknown> }>,
 *   loading: boolean,
 *   error: Error | null,
 *   refetch: () => Promise<void>,
 *   dataSource: 'mock' | 'feishu' | 'mock_fallback' | null,
 *   meta: { feishuConfigured?: boolean, forceMock?: boolean, missingKeys?: string[] } | null
 * }}
 */
export function useFeishuData() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState(null)
  const [meta, setMeta] = useState(null)
  const [limitUpRecords, setLimitUpRecords] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bitable-records', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`)
      }
      setRecords(Array.isArray(json.records) ? json.records : [])
      setLimitUpRecords(Array.isArray(json.limitUpRecords) ? json.limitUpRecords : [])
      setDataSource(json.source ?? null)
      setMeta(json.meta ?? null)
      if (json.source === 'mock_fallback' && json.error) {
        setError(new Error(json.error))
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
      setRecords(buildBitableRecordsFromMock())
      setLimitUpRecords([])
      setDataSource('mock')
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refetch = useCallback(async () => {
    await load()
  }, [load])

  return { records, loading, error, refetch, dataSource, meta, limitUpRecords }
}
