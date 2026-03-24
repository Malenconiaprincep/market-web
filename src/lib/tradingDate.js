/** 看盘用：北京时间日历日 YYYY-MM-DD */
export function getTodayYmdShanghai() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function normalizeDateKey(value) {
  if (value == null || value === '') return ''
  const s = String(value).trim()
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

/**
 * 优先使用「今日」情绪行（用于 Hero / 复盘）；无今日则用最晚一条
 * @param {Array<Record<string, unknown>>} rows
 */
export function pickSnapshotRow(rows) {
  if (!rows?.length) return null
  const sorted = [...rows].sort((a, b) =>
    String(a.date || '').localeCompare(String(b.date || '')),
  )
  const today = getTodayYmdShanghai()
  const todayRow = sorted.find((r) => normalizeDateKey(r.date) === today)
  return todayRow ?? sorted.at(-1)
}

/**
 * 涨停明细行：按当前页「数据日期」筛选；无日期列时退回全部并带说明
 * @param {Array<Record<string, unknown>>} rows
 */
export function filterLimitUpRowsBySnapshotDate(rows, snapshotDate, isTodaySnapshot) {
  const target = normalizeDateKey(snapshotDate)
  if (!rows?.length) {
    return { rows: [], mode: 'empty', notice: null }
  }
  if (!target) {
    return { rows, mode: 'no_snapshot', notice: null }
  }
  const withDate = rows.filter((r) => normalizeDateKey(r.date))
  if (withDate.length === 0) {
    const notice = isTodaySnapshot
      ? '涨停表未配置「日期」列：下列为表中全部记录（若表内只维护当日涨停池，即视为当日）。'
      : '涨停表未配置「日期」列，无法按交易日筛选，暂显示全部记录。请增加「日期」列并与情绪表「日期」一致。'
    return { rows, mode: 'no_date_column', notice }
  }
  const filtered = rows.filter((r) => normalizeDateKey(r.date) === target)
  const notice =
    filtered.length === 0
      ? `涨停表中无「日期」为 ${target} 的记录，请核对飞书数据或日期格式。`
      : null
  return { rows: filtered, mode: 'filtered', notice }
}
