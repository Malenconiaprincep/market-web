import { NextResponse } from 'next/server'

import {
  getMarketSkillsBase,
  marketSkillsBaseConfigError,
  marketSkillsHeaders,
} from '@/lib/marketSkillsProxy.js'

export async function GET(request) {
  const base = getMarketSkillsBase()
  const cfgErr = marketSkillsBaseConfigError(base)
  if (cfgErr) {
    return NextResponse.json({ ok: false, error: cfgErr }, { status: 503 })
  }
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
  const slot = searchParams.get('slot')
  if (!slot?.trim()) {
    return NextResponse.json({ ok: false, error: 'missing slot' }, { status: 400 })
  }
  const url = `${base}/api/intraday?slot=${encodeURIComponent(slot.trim())}`
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
          'Next 服务端连不上上述地址。请启动 market-skills：cd market-skills && uvicorn main:app --host 127.0.0.1 --port 8787，并把 .env.local 里 MARKET_SKILLS_API_BASE 设为 http://127.0.0.1:8787（改完需重启 next dev）。',
      },
      { status: 502 },
    )
  }
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
