import { NextResponse } from 'next/server'

import {
  getMarketSkillsBase,
  marketSkillsBaseConfigError,
  marketSkillsHeaders,
} from '@/lib/marketSkillsProxy.js'

/** 转发 FastAPI GET /api/history（飞书情绪表最近约 15 天） */
export async function GET() {
  const base = getMarketSkillsBase()
  const cfgErr = marketSkillsBaseConfigError(base)
  if (cfgErr) {
    return NextResponse.json({ ok: false, error: cfgErr, records: [] }, { status: 503 })
  }
  if (!base) {
    return NextResponse.json(
      {
        ok: false,
        error: '未配置 MARKET_SKILLS_API_BASE',
        records: [],
      },
      { status: 503 },
    )
  }
  const url = `${base}/api/history`
  let res
  try {
    res = await fetch(url, { headers: marketSkillsHeaders(), cache: 'no-store' })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        upstream: url,
        records: [],
      },
      { status: 502 },
    )
  }
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
