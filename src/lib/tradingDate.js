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
 * 情绪行里出现过的日期，新→旧，供复盘日期下拉
 * @param {Array<Record<string, unknown>>} rows
 */
export function listSortedDateKeys(rows) {
  const keys = new Set()
  for (const r of rows || []) {
    const k = normalizeDateKey(r.date)
    if (k) keys.add(k)
  }
  return [...keys].sort((a, b) => b.localeCompare(a))
}

/**
 * 按 YYYY-MM-DD 取当日情绪行
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} dateKey
 */
export function findSnapshotRowByDateKey(rows, dateKey) {
  if (!dateKey || !rows?.length) return null
  return rows.find((r) => normalizeDateKey(r.date) === dateKey) ?? null
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

/** 与 market-skills intraday_runner.SLOTS 一致 */
export const INTRADAY_SLOTS = ['09:40', '10:30', '14:30']

/**
 * 上海时区当前时刻下，建议默认选的盘中快照槽位（用于「实时」页默认拉最近落点）。
 */
export function getSuggestedIntradaySlot() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  const mins = h * 60 + m
  if (mins < 9 * 60 + 40) return '09:40'
  if (mins < 10 * 60 + 30) return '09:40'
  if (mins < 14 * 60 + 30) return '10:30'
  return '14:30'
}
