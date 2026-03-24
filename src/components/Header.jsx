'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

function formatNow() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const nav = [
  { href: '/', label: '复盘' },
  { href: '/realtime', label: '实时' },
]

export default function Header() {
  /** 避免 SSR 与客户端首帧时间不一致导致 Hydration mismatch：仅在挂载后再显示实时时间 */
  const [now, setNow] = useState(null)
  const pathname = usePathname()

  useEffect(() => {
    setNow(formatNow())
    const id = setInterval(() => setNow(formatNow()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
      <div>
        <nav className="mb-2 flex flex-wrap gap-2 text-xs">
          {nav.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? 'rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-amber-200/90'
                    : 'rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-400 hover:text-zinc-200'
                }
              >
                {label}
              </Link>
            )
          })}
        </nav>
        <h1 className="text-lg font-bold tracking-tight text-quant-text md:text-xl">
          ALPHA QUANT EMOTION HUB
        </h1>
        <p className="text-xs text-zinc-400">
          {pathname === '/realtime'
            ? '盘中情绪 · 实时（market-skills API）'
            : 'A-Share Market Sentiment'}
        </p>
      </div>
      <time
        dateTime={now ?? undefined}
        suppressHydrationWarning
        className="min-w-[200px] text-right font-mono text-sm tabular-nums text-zinc-300"
      >
        {now ?? '—'}
      </time>
    </header>
  )
}
