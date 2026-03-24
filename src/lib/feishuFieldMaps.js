/**
 * 飞书多维表格「列名」→ 前端统一字段（与 mock / 组件约定一致）
 * 注意：list records 返回的 fields 可能是 field_id（fldxxx）为键，也可能直接是「中文列名」为键，需双重映射。
 */

import { normalizeFeishuCellValue } from './feishuBitable.js'

/** 情绪记录表（第二张图） */
export const SENTIMENT_FIELD_NAMES = {
  日期: 'date',
  涨停数: 'zt_count',
  跌停数: 'dt_count',
  情绪温度: 'temperature',
  情绪结论: 'ai_recap_text',
  空间龙: 'top_stock',
  空间龙连板: 'top_height',
}

/** 涨停数据表（第一张图）；「日期」可选，有则按交易日与上方情绪快照对齐筛选 */
export const LIMIT_UP_FIELD_NAMES = {
  日期: 'date',
  股票代码: 'stock_code',
  股票名称: 'stock_name',
  /** 与 akshare 东财涨停池「所属行业」一致；表内可填可空，空时复盘页会尝试用引擎接口补全 */
  所属行业: 'industry',
  涨跌幅: 'pct_change',
  最新价: 'latest_price',
  连板数: 'board_count',
  成交额: 'turnover',
  换手率: 'turnover_rate',
}

/**
 * @param {Array<{ field_id: string, field_name?: string, name?: string }>} fieldItems
 * @param {Record<string, string>} nameToKey
 */
export function buildFieldIdMapFromColumnNames(fieldItems, nameToKey) {
  const map = {}
  for (const f of fieldItems || []) {
    const rawName = f.field_name ?? f.name ?? ''
    const name = String(rawName).trim()
    const key = nameToKey[name]
    if (key && f.field_id) {
      map[f.field_id] = key
    }
  }
  return map
}

/**
 * 将单条 record.fields 转为内部字段：优先 field_id，再合并中文列名（与 list fields 中列名一致）
 * @param {Record<string, unknown>} rawFields
 * @param {Record<string, string>} mergedIdMap field_id → 内部字段名
 * @param {Record<string, string>} nameToKey 中文列名 → 内部字段名
 */
export function mapTableFieldsFromRaw(rawFields, mergedIdMap, nameToKey) {
  const flat = {}
  for (const [k, v] of Object.entries(rawFields || {})) {
    flat[k] = normalizeFeishuCellValue(v)
  }
  const out = {}
  for (const [fid, internal] of Object.entries(mergedIdMap || {})) {
    if (flat[fid] !== undefined) {
      out[internal] = flat[fid]
    }
  }
  for (const [cn, internal] of Object.entries(nameToKey || {})) {
    if (flat[cn] !== undefined && out[internal] === undefined) {
      out[internal] = flat[cn]
    }
  }
  return out
}

function toMs(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n)) return NaN
  return n < 1e12 ? n * 1000 : n
}

/** A 股展示用：按北京时间日历日，避免 UTC 与本地混用差一天 */
export function formatDateFromRecordTime(ts) {
  const ms = toMs(ts)
  if (!Number.isFinite(ms)) return null
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(ms))
  } catch {
    const d = new Date(ms)
    const pad = (x) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
}

/**
 * 情绪行：补默认列、类型转换；无「日期」时用记录创建时间
 */
function stripBitableFieldIdKeys(obj) {
  const out = { ...obj }
  for (const k of Object.keys(out)) {
    if (k.startsWith('fld')) delete out[k]
  }
  return out
}

export function finalizeSentimentFields(fields, record) {
  const out = stripBitableFieldIdKeys(fields)
  if (out.date != null && out.date !== '') {
    const d = out.date
    if (typeof d === 'number' || (typeof d === 'string' && /^\d+$/.test(String(d).trim()))) {
      const fd = formatDateFromRecordTime(d)
      if (fd) out.date = fd
    }
  }
  if (out.temperature != null && out.temperature !== '') {
    out.temperature = Number(out.temperature)
  }
  if (out.zt_count != null && out.zt_count !== '') out.zt_count = Number(out.zt_count)
  if (out.dt_count != null && out.dt_count !== '') out.dt_count = Number(out.dt_count)
  if (out.top_height != null && out.top_height !== '') out.top_height = Number(out.top_height)
  if (!out.date && record?.created_time != null) {
    const fd = formatDateFromRecordTime(record.created_time)
    if (fd) out.date = fd
  }
  if (out.ai_recap_text == null) out.ai_recap_text = ''
  if (!out.cycle_phase) out.cycle_phase = '—'
  if (!out.cycle_note) out.cycle_note = ''
  return out
}

export function finalizeLimitUpFields(fields) {
  const out = stripBitableFieldIdKeys(fields)
  if (out.date != null && out.date !== '') {
    const d = out.date
    if (typeof d === 'number' || (typeof d === 'string' && /^\d+$/.test(String(d).trim()))) {
      const fd = formatDateFromRecordTime(d)
      if (fd) out.date = fd
    }
  }
  const numKeys = ['pct_change', 'latest_price', 'board_count', 'turnover', 'turnover_rate']
  for (const k of numKeys) {
    if (out[k] != null && out[k] !== '') {
      const n = Number(out[k])
      out[k] = Number.isFinite(n) ? n : out[k]
    }
  }
  if (out.stock_code == null) out.stock_code = ''
  if (out.stock_name == null) out.stock_name = ''
  if (out.industry == null) out.industry = ''
  return out
}
