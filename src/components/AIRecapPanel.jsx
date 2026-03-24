import ReactMarkdown from 'react-markdown'

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

/**
 * @param {{ title?: string, recapText?: string, useMarkdown?: boolean, variant?: 'fill' | 'compact' }} props
 * - fill：占满父级高度（旧布局）
 * - compact：高度随内容，正文过长时在 max-h 内滚动，避免短文案撑出大块留白
 */
export default function AIRecapPanel({
  title = '游资视点 · AI 深度复盘',
  recapText,
  useMarkdown = false,
  className = '',
  variant = 'fill',
}) {
  const shell =
    variant === 'compact'
      ? 'h-auto max-h-full flex-col rounded-lg border border-white/10 bg-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-4'
      : 'h-full min-h-0 flex-col rounded-lg border border-white/10 bg-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-4'

  const bodyScroll =
    variant === 'compact'
      ? 'mt-2 max-h-[min(36vh,280px)] overflow-y-auto pr-1'
      : 'mt-3 min-h-0 flex-1 overflow-y-auto pr-1'

  return (
    <aside className={`flex ${shell} ${className}`}>
      <h2 className="shrink-0 border-b border-white/10 pb-2 text-sm font-semibold tracking-wide text-quant-text">
        {title}
      </h2>
      <div className={bodyScroll}>
        {recapText ? (
          useMarkdown ? (
            <div className="markdown-recap text-sm leading-relaxed text-zinc-300 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:text-amber-500 [&_ul]:list-disc [&_ul]:pl-5">
              <ReactMarkdown>{recapText}</ReactMarkdown>
            </div>
          ) : (
            <HighlightedText text={recapText} />
          )
        ) : (
          <p className="text-sm text-zinc-500">暂无复盘内容</p>
        )}
      </div>
    </aside>
  )
}
