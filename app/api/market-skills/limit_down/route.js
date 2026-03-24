import { NextResponse } from 'next/server'

import { getMarketSkillsBase, marketSkillsHeaders } from '@/lib/marketSkillsProxy.js'

export async function GET(request) {
  const base = getMarketSkillsBase()
  if (!base) {
    return NextResponse.json(
      {
        ok: false,
        error:
          '未配置 MARKET_SKILLS_API_BASE（market-skills 根地址，例如 http://127.0.0.1:8787）',
      },
      { status: 503 },
    )
  }
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const q = date?.trim() ? `?date=${encodeURIComponent(date.trim())}` : ''
  const url = `${base}/api/limit_down${q}`
  let res
  try {
    res = await fetch(url, { headers: marketSkillsHeaders(), cache: 'no-store' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        upstream: url,
        hint:
          'Next 服务端连不上上述地址。请确认 market-skills 已启动（uvicorn main:app），且 MARKET_SKILLS_API_BASE 端口一致（改 .env.local 后需重启 next dev）。',
      },
      { status: 502 },
    )
  }
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
