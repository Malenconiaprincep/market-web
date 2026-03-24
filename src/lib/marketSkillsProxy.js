/**
 * 服务端：转发请求到 market-skills（uvicorn main:app）。
 * 浏览器只请求本站 /api/market-skills/*，密钥留在服务端。
 */

export function getMarketSkillsBase() {
  const base = process.env.MARKET_SKILLS_API_BASE?.trim().replace(/\/$/, '')
  return base || null
}

/**
 * 若 BASE 指向 Next 默认端口，服务端会 fetch /api/intraday 等到本机 3000，
 * 而 Next 只有 /api/market-skills/*，会得到 404。提前拦截并给出明确提示。
 */
export function marketSkillsBaseConfigError(base) {
  if (!base) return null
  if (/:3000(\/|$)/.test(base)) {
    return 'MARKET_SKILLS_API_BASE 不能指向 Next 的 3000 端口。请指向 uvicorn，例如 http://127.0.0.1:8787（cd market-skills && uvicorn main:app --host 127.0.0.1 --port 8787），改 .env.local 后需重启 next dev'
  }
  return null
}

export function marketSkillsHeaders() {
  const headers = { Accept: 'application/json' }
  const secret = process.env.MARKET_SKILLS_API_SECRET?.trim()
  if (secret) {
    headers.Authorization = `Bearer ${secret}`
  }
  return headers
}
