import { NextResponse } from 'next/server'
import { buildBitableRecordsFromMock } from '@/lib/mockBitable.js'
import {
  fetchAllBitableFields,
  fetchAllBitableRecords,
  getTenantAccessToken,
} from '@/lib/feishuBitable.js'
import {
  buildFieldIdMapFromColumnNames,
  finalizeLimitUpFields,
  finalizeSentimentFields,
  LIMIT_UP_FIELD_NAMES,
  mapTableFieldsFromRaw,
  SENTIMENT_FIELD_NAMES,
} from '@/lib/feishuFieldMaps.js'

const FEISHU_ENV_KEYS = [
  'FEISHU_APP_ID',
  'FEISHU_APP_SECRET',
  'FEISHU_BITABLE_APP_TOKEN',
  'FEISHU_BITABLE_TABLE_ID',
]

/** 去掉首尾空格/BOM，避免 .env 里误带空格导致「配了却读不到」 */
function envTrim(key) {
  const v = process.env[key]
  if (v == null) return ''
  return String(v).replace(/^\uFEFF/, '').trim()
}

function getMissingFeishuKeys() {
  return FEISHU_ENV_KEYS.filter((k) => !envTrim(k))
}

function parseFieldMap() {
  const raw = envTrim('FEISHU_BITABLE_FIELD_MAP')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function isFeishuConfigured() {
  return getMissingFeishuKeys().length === 0
}

function buildMeta({ feishuConfigured, forceMock, hasZtTable }) {
  return {
    feishuConfigured,
    forceMock,
    missingKeys: feishuConfigured ? [] : getMissingFeishuKeys(),
    hasZtTable: Boolean(hasZtTable),
  }
}

async function loadSentimentRecords(token, appToken, tableId, manualFieldMap) {
  const fieldItems = await fetchAllBitableFields({
    tenantAccessToken: token,
    appToken,
    tableId,
  })
  const autoMap = buildFieldIdMapFromColumnNames(fieldItems, SENTIMENT_FIELD_NAMES)
  const merged = { ...autoMap, ...(manualFieldMap || {}) }
  const items = await fetchAllBitableRecords({
    tenantAccessToken: token,
    appToken,
    tableId,
  })
  return items.map((item) => {
    const fields = mapTableFieldsFromRaw(item.fields || {}, merged, SENTIMENT_FIELD_NAMES)
    return {
      record_id: item.record_id,
      fields: finalizeSentimentFields(fields, item),
    }
  })
}

async function loadLimitUpRecords(token, appToken, tableId) {
  const fieldItems = await fetchAllBitableFields({
    tenantAccessToken: token,
    appToken,
    tableId,
  })
  const merged = buildFieldIdMapFromColumnNames(fieldItems, LIMIT_UP_FIELD_NAMES)
  const items = await fetchAllBitableRecords({
    tenantAccessToken: token,
    appToken,
    tableId,
  })
  return items.map((item) => {
    const fields = mapTableFieldsFromRaw(item.fields || {}, merged, LIMIT_UP_FIELD_NAMES)
    return {
      record_id: item.record_id,
      fields: finalizeLimitUpFields(fields),
    }
  })
}

/**
 * GET /api/bitable-records
 * 情绪表：FEISHU_BITABLE_TABLE_ID；涨停明细表（可选）：FEISHU_BITABLE_TABLE_ID_ZT
 */
export async function GET() {
  const forceMockRaw = envTrim('FEISHU_USE_MOCK')
  const forceMock =
    forceMockRaw === '1' ||
    forceMockRaw.toLowerCase() === 'true' ||
    forceMockRaw.toLowerCase() === 'yes'

  const feishuConfigured = isFeishuConfigured()

  if (forceMock || !feishuConfigured) {
    return NextResponse.json({
      records: buildBitableRecordsFromMock(),
      limitUpRecords: [],
      source: 'mock',
      meta: buildMeta({ feishuConfigured, forceMock, hasZtTable: false }),
    })
  }

  try {
    const appId = envTrim('FEISHU_APP_ID')
    const appSecret = envTrim('FEISHU_APP_SECRET')
    const appToken = envTrim('FEISHU_BITABLE_APP_TOKEN')
    const sentimentTableId = envTrim('FEISHU_BITABLE_TABLE_ID')
    const ztTableId = envTrim('FEISHU_BITABLE_TABLE_ID_ZT')
    const hasZtTable = Boolean(ztTableId)
    const manualFieldMap = parseFieldMap()

    const token = await getTenantAccessToken(appId, appSecret)

    const records = await loadSentimentRecords(token, appToken, sentimentTableId, manualFieldMap)

    let limitUpRecords = []
    if (ztTableId) {
      limitUpRecords = await loadLimitUpRecords(token, appToken, ztTableId)
    }

    return NextResponse.json({
      records,
      limitUpRecords,
      source: 'feishu',
      meta: buildMeta({ feishuConfigured: true, forceMock: false, hasZtTable }),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: message,
        records: buildBitableRecordsFromMock(),
        limitUpRecords: [],
        source: 'mock_fallback',
        meta: buildMeta({ feishuConfigured: true, forceMock: false, hasZtTable: false }),
      },
      { status: 200 },
    )
  }
}
