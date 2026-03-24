const KEYWORD_RE = /(冰点|退潮|主升|分歧|抱团|修复|试错|发酵|龙头)/g

function HighlightedText({ text }) {
  if (!text) return null
  const parts = []
  let last = 0
  let m
  const re = new RegExp(KEYWORD_RE.source, 'g')
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: 'plain', value: text.slice(last, m.index) })
    }
    parts.push({ type: 'kw', value: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) {
    parts.push({ type: 'plain', value: text.slice(last) })
  }
  return (
    <p className="text-sm leading-relaxed text-zinc-300">
      {parts.map((p, i) =>
        p.type === 'kw' ? (
          <strong key={i} className="font-bold text-amber-500">
            {p.value}
          </strong>
        ) : (
          <span key={i}>{p.value}</span>
        ),
      )}
    </p>
  )
}

export default function AIRecapPanel({ title = '游资视点 · AI 深度复盘', recapText }) {
  return (
    <aside className="flex h-full min-h-[360px] flex-col rounded-lg border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
      <h2 className="border-b border-white/10 pb-2 text-sm font-semibold tracking-wide text-quant-text">
        {title}
      </h2>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {recapText ? (
          <HighlightedText text={recapText} />
        ) : (
          <p className="text-sm text-zinc-500">暂无复盘内容</p>
        )}
      </div>
    </aside>
  )
}
