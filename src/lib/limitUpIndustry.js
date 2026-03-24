/**
 * 涨停池「所属行业」：与 market-skills 中 ak.stock_zt_pool_em（market_sentiment / get_limit_up_pool）列名一致。
 */

/** @param {unknown} code */
export function normalizeAStockCode(code) {
  if (code == null || code === '') return ''
  const s = String(code).trim()
  const m = s.match(/(\d{6})/)
  return m ? m[1] : ''
}

/**
 * @param {Array<Record<string, unknown>>} akRows GET /api/limit_up 返回的 rows（含「代码」「所属行业」等）
 * @returns {Map<string, string>} 6 位代码 → 行业
 */
export function buildIndustryLookupFromAkshareRows(akRows) {
  const m = new Map()
  if (!Array.isArray(akRows)) return m
  for (const row of akRows) {
    const code = normalizeAStockCode(row['代码'] ?? row.code)
    const ind = row['所属行业'] ?? row.industry
    if (code && ind != null && String(ind).trim() !== '') {
      m.set(code, String(ind).trim())
    }
  }
  return m
}
