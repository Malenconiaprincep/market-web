import { NextResponse } from 'next/server'

import { getMarketSkillsBase, marketSkillsHeaders } from '@/lib/marketSkillsProxy.js'

/** 转发 FastAPI GET /api/realtime（盘中快照 + 预警） */
export async function GET() {
  const base = getMarketSkillsBase()
  if (!base) {
    return NextResponse.json(
      {
        ok: false,
        error: '未配置 MARKET_SKILLS_API_BASE',
      },
      { status: 503 },
    )
  }
  const url = `${base}/api/realtime`
  let res
  try {
    res = await fetch(url, { headers: marketSkillsHeaders(), cache: 'no-store' })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        upstream: url,
        hint: '无法连接 market-skills（需启动 uvicorn main:app）',
      },
      { status: 502 },
    )
  }
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
