/**
 * 服务端：转发请求到 market-skills（uvicorn main:app）。
 * 浏览器只请求本站 /api/market-skills/*，密钥留在服务端。
 */

export function getMarketSkillsBase() {
  const base = process.env.MARKET_SKILLS_API_BASE?.trim().replace(/\/$/, '')
  return base || null
}

export function marketSkillsHeaders() {
  const headers = { Accept: 'application/json' }
  const secret = process.env.MARKET_SKILLS_API_SECRET?.trim()
  if (secret) {
    headers.Authorization = `Bearer ${secret}`
  }
  return headers
}
