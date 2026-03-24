/**
 * 服务端：飞书多维表格字段值归一化（不同字段类型结构不同，见开放平台文档）
 */
export function normalizeFeishuCellValue(value) {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    const first = value[0]
    if (first && typeof first === 'object' && first.text != null) {
      return value.map((x) => (x && x.text != null ? String(x.text) : '')).join('')
    }
    return value[0]
  }
  if (typeof value === 'object') {
    if (value.text != null) return String(value.text)
    if (value.link != null) return String(value.link)
  }
  return String(value)
}

/** 将多维表格 record.fields 转为扁平值，并可选按 field_id → 业务字段名 映射 */
export function mapRecordFields(rawFields, fieldIdMap) {
  const flat = {}
  for (const [key, val] of Object.entries(rawFields || {})) {
    flat[key] = normalizeFeishuCellValue(val)
  }
  if (!fieldIdMap || Object.keys(fieldIdMap).length === 0) {
    return flat
  }
  const out = {}
  for (const [fieldId, targetName] of Object.entries(fieldIdMap)) {
    if (flat[fieldId] !== undefined) {
      out[targetName] = flat[fieldId]
    }
  }
  for (const [k, v] of Object.entries(flat)) {
    if (
      !Object.prototype.hasOwnProperty.call(out, k) &&
      !Object.prototype.hasOwnProperty.call(fieldIdMap, k)
    ) {
      out[k] = v
    }
  }
  return out
}

const TOKEN_URL = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal'

export async function getTenantAccessToken(appId, appSecret) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.msg || json.error || `获取 tenant_access_token HTTP ${res.status}`)
  }
  if (json.code !== 0) {
    throw new Error(json.msg || json.error || `获取 tenant_access_token 失败: code=${json.code}`)
  }
  return json.tenant_access_token
}

export async function fetchAllBitableRecords({
  tenantAccessToken,
  appToken,
  tableId,
  pageSize = 500,
}) {
  const base = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records`
  const all = []
  let pageToken = undefined

  for (let guard = 0; guard < 50; guard += 1) {
    const params = new URLSearchParams({ page_size: String(pageSize) })
    if (pageToken) params.set('page_token', pageToken)
    const res = await fetch(`${base}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${tenantAccessToken}` },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(json.msg || json.error || `列出记录 HTTP ${res.status}`)
    }
    if (json.code !== 0) {
      throw new Error(json.msg || json.error || `列出记录失败: code=${json.code}`)
    }
    const data = json.data || {}
    const items = data.items || []
    all.push(...items)
    if (!data.has_more) break
    pageToken = data.page_token
    if (!pageToken) break
  }

  return all
}

/** 列出数据表全部字段（用于 field_id ↔ 中文列名 映射） */
export async function fetchAllBitableFields({ tenantAccessToken, appToken, tableId, pageSize = 100 }) {
  const base = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/fields`
  const all = []
  let pageToken = undefined

  for (let guard = 0; guard < 20; guard += 1) {
    const params = new URLSearchParams({ page_size: String(pageSize) })
    if (pageToken) params.set('page_token', pageToken)
    const res = await fetch(`${base}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${tenantAccessToken}` },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(json.msg || json.error || `列出字段 HTTP ${res.status}`)
    }
    if (json.code !== 0) {
      throw new Error(json.msg || json.error || `列出字段失败: code=${json.code}`)
    }
    const data = json.data || {}
    const items = data.items || []
    all.push(...items)
    if (!data.has_more) break
    pageToken = data.page_token
    if (!pageToken) break
  }

  return all
}
