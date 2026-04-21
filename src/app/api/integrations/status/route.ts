import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { getKingdeeConfigSummary } from '@/lib/server/finance-live/kingdee-k3cloud'

export const runtime = 'nodejs'

type IntegrationRuntimeState = 'connected' | 'needs_config' | 'degraded'

interface IntegrationStatusItem {
  key: 'gaya' | 'kingdee' | 'xiaoniu' | 'meituan'
  status: IntegrationRuntimeState
  configured: boolean
  message: string
  requiredEnvKeys: string[]
  missingEnvKeys: string[]
  hints: string[]
}

const clip = (value: unknown, fallback = '', max = 600) => {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, max)
}

const parseBooleanFlag = (value?: string) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

const hasValue = (value: unknown) => clip(value, '', 600).length > 0

const formatMissingEnvKeys = (keys: string[], maxItems = 4) => {
  if (keys.length <= 0) return ''
  const visible = keys.slice(0, maxItems)
  const suffix = keys.length > maxItems ? ` 等${keys.length}项` : ''
  return `${visible.join(', ')}${suffix}`
}

const uniqueKeys = (keys: string[]) => Array.from(new Set(keys.filter(Boolean)))

const resolveGaiaStatus = (): IntegrationStatusItem => {
  const endpointConfigured = hasValue(process.env.GAIA_API_ROSTER_URL)
  const tokenConfigured = hasValue(process.env.GAIA_API_TOKEN)
  const headersConfigured = hasValue(process.env.GAIA_API_HEADERS_JSON)
  const authConfigured = tokenConfigured || headersConfigured
  const requiredEnvKeys = ['GAIA_API_ROSTER_URL', 'GAIA_API_TOKEN', 'GAIA_API_HEADERS_JSON']
  const missingEnvKeys = uniqueKeys([
    ...(endpointConfigured ? [] : ['GAIA_API_ROSTER_URL']),
    ...(authConfigured ? [] : ['GAIA_API_TOKEN', 'GAIA_API_HEADERS_JSON']),
  ])
  const hints = ['GAIA_API_TOKEN 与 GAIA_API_HEADERS_JSON 二选一即可']
  if (endpointConfigured && authConfigured) {
    return {
      key: 'gaya',
      status: 'connected',
      configured: true,
      message: '盖雅远程接口参数完整，可执行自动拉取。',
      requiredEnvKeys,
      missingEnvKeys: [],
      hints,
    }
  }
  if (endpointConfigured) {
    return {
      key: 'gaya',
      status: 'degraded',
      configured: false,
      message: '已配置盖雅地址，但缺少鉴权信息。',
      requiredEnvKeys,
      missingEnvKeys,
      hints,
    }
  }
  return {
    key: 'gaya',
    status: 'needs_config',
    configured: false,
    message: '未配置 GAIA_API_ROSTER_URL。',
    requiredEnvKeys,
    missingEnvKeys,
    hints,
  }
}

const resolveKingdeeDirectStatus = (scheduleTokenConfigured: boolean): IntegrationStatusItem => {
  const summary = getKingdeeConfigSummary()
  const requiredEnvKeys = [
    'KINGDEE_K3CLOUD_BASE_URL',
    'KINGDEE_K3CLOUD_ACCT_ID',
    'KINGDEE_K3CLOUD_USERNAME',
    'KINGDEE_K3CLOUD_APP_ID',
    'KINGDEE_K3CLOUD_APP_SECRET',
    'KINGDEE_K3CLOUD_FORM_ID',
    'KINGDEE_K3CLOUD_FIELD_KEYS',
    'KINGDEE_K3CLOUD_METRIC_MAP_JSON',
    'CRON_SECRET',
    'FINANCE_LIVE_CRON_TOKEN',
    'FINANCE_LIVE_INGEST_TOKEN',
  ]
  const missingMetricMapping = summary.metricMappingConfigured
    ? []
    : ['KINGDEE_K3CLOUD_FIELD_KEYS', 'KINGDEE_K3CLOUD_METRIC_MAP_JSON']
  const missingTriggerKeys = scheduleTokenConfigured
    ? []
    : ['CRON_SECRET', 'FINANCE_LIVE_CRON_TOKEN', 'FINANCE_LIVE_INGEST_TOKEN']
  const missingEnvKeys = uniqueKeys([
    ...(summary.missingRequiredEnvKeys || []),
    ...missingMetricMapping,
    ...missingTriggerKeys,
  ])
  const missingHint = formatMissingEnvKeys(summary.missingRequiredEnvKeys || [])
  const mappingHint = summary.metricMappingConfigured
    ? ''
    : ' 缺少字段映射（KINGDEE_K3CLOUD_FIELD_KEYS 或 KINGDEE_K3CLOUD_METRIC_MAP_JSON）。'
  const hints = [
    '字段映射使用 KINGDEE_K3CLOUD_FIELD_KEYS 或 KINGDEE_K3CLOUD_METRIC_MAP_JSON 二选一',
    '定时触发令牌可用 CRON_SECRET / FINANCE_LIVE_CRON_TOKEN / FINANCE_LIVE_INGEST_TOKEN 任一',
  ]
  if (summary.configured && scheduleTokenConfigured) {
    return {
      key: 'kingdee',
      status: 'connected',
      configured: true,
      message: `金蝶云星空直连已配置（${summary.baseUrlHint} · ${summary.formId}）。`,
      requiredEnvKeys,
      missingEnvKeys: [],
      hints,
    }
  }
  if (summary.configured || scheduleTokenConfigured) {
    return {
      key: 'kingdee',
      status: 'degraded',
      configured: false,
      message:
        summary.configured && !scheduleTokenConfigured
          ? '缺少同步触发令牌（CRON_SECRET / FINANCE_LIVE_CRON_TOKEN / FINANCE_LIVE_INGEST_TOKEN）。'
          : `金蝶直连配置不完整：${missingHint || '需补齐必填连接参数。'}。${mappingHint}`.trim(),
      requiredEnvKeys,
      missingEnvKeys,
      hints,
    }
  }
  return {
    key: 'kingdee',
    status: 'needs_config',
    configured: false,
    message: `未配置金蝶云星空直连参数：${missingHint || '请先设置必填环境变量。'}。${mappingHint}`.trim(),
    requiredEnvKeys,
    missingEnvKeys,
    hints,
  }
}

const resolveRemoteFinanceStatus = (scheduleTokenConfigured: boolean): IntegrationStatusItem => {
  const pullConfigured = hasValue(process.env.FINANCE_LIVE_PULL_URL)
  const requiredEnvKeys = [
    'FINANCE_LIVE_PULL_URL',
    'FINANCE_LIVE_INGEST_TOKEN',
    'FINANCE_LIVE_INGEST_TOKENS',
    'CRON_SECRET',
    'FINANCE_LIVE_CRON_TOKEN',
  ]
  const missingEnvKeys = uniqueKeys([
    ...(pullConfigured ? [] : ['FINANCE_LIVE_PULL_URL']),
    ...(scheduleTokenConfigured
      ? []
      : ['FINANCE_LIVE_INGEST_TOKEN', 'FINANCE_LIVE_INGEST_TOKENS', 'CRON_SECRET', 'FINANCE_LIVE_CRON_TOKEN']),
  ])
  const hints = ['FINANCE_LIVE_INGEST_TOKEN / FINANCE_LIVE_INGEST_TOKENS / CRON_SECRET / FINANCE_LIVE_CRON_TOKEN 任一可触发']
  if (pullConfigured && scheduleTokenConfigured) {
    return {
      key: 'kingdee',
      status: 'connected',
      configured: true,
      message: '财务实时拉取与写入鉴权已配置。',
      requiredEnvKeys,
      missingEnvKeys: [],
      hints,
    }
  }
  if (pullConfigured || scheduleTokenConfigured) {
    return {
      key: 'kingdee',
      status: 'degraded',
      configured: false,
      message: '财务集成配置不完整（需同时配置拉取地址与写入令牌）。',
      requiredEnvKeys,
      missingEnvKeys,
      hints,
    }
  }
  return {
    key: 'kingdee',
    status: 'needs_config',
    configured: false,
    message: '未配置财务实时数据连接参数。',
    requiredEnvKeys,
    missingEnvKeys,
    hints,
  }
}

const resolveFinanceStatus = (): IntegrationStatusItem => {
  const triggerTokenConfigured =
    hasValue(process.env.FINANCE_LIVE_INGEST_TOKEN) || hasValue(process.env.FINANCE_LIVE_INGEST_TOKENS)
  const cronSecretConfigured = hasValue(process.env.CRON_SECRET) || hasValue(process.env.FINANCE_LIVE_CRON_TOKEN)
  const scheduleTokenConfigured = triggerTokenConfigured || cronSecretConfigured
  const provider = clip(process.env.FINANCE_LIVE_PULL_PROVIDER, 'remote-url', 80).toLowerCase() || 'remote-url'
  return provider === 'kingdee-k3cloud'
    ? resolveKingdeeDirectStatus(scheduleTokenConfigured)
    : resolveRemoteFinanceStatus(scheduleTokenConfigured)
}

const resolveSupplyStatus = (): IntegrationStatusItem => {
  const endpointConfigured = hasValue(process.env.SUPPLY_API_BASE_URL) || hasValue(process.env.SUPPLY_SYNC_API_URL)
  const tokenConfigured = hasValue(process.env.SUPPLY_API_TOKEN) || hasValue(process.env.SUPPLY_SYNC_TOKEN)
  const requiredEnvKeys = ['SUPPLY_API_BASE_URL', 'SUPPLY_SYNC_API_URL', 'SUPPLY_API_TOKEN', 'SUPPLY_SYNC_TOKEN']
  const missingEnvKeys = uniqueKeys([
    ...(endpointConfigured ? [] : ['SUPPLY_API_BASE_URL', 'SUPPLY_SYNC_API_URL']),
    ...(tokenConfigured ? [] : ['SUPPLY_API_TOKEN', 'SUPPLY_SYNC_TOKEN']),
  ])
  const hints = ['地址可用 SUPPLY_API_BASE_URL / SUPPLY_SYNC_API_URL 二选一，鉴权可用 SUPPLY_API_TOKEN / SUPPLY_SYNC_TOKEN 二选一']
  if (endpointConfigured && tokenConfigured) {
    return {
      key: 'xiaoniu',
      status: 'connected',
      configured: true,
      message: '供应链接口地址与鉴权已配置。',
      requiredEnvKeys,
      missingEnvKeys: [],
      hints,
    }
  }
  if (endpointConfigured) {
    return {
      key: 'xiaoniu',
      status: 'degraded',
      configured: false,
      message: '已配置供应链地址，但缺少鉴权令牌。',
      requiredEnvKeys,
      missingEnvKeys,
      hints,
    }
  }
  return {
    key: 'xiaoniu',
    status: 'needs_config',
    configured: false,
    message: '未配置供应链实时接口。',
    requiredEnvKeys,
    missingEnvKeys,
    hints,
  }
}

const resolveMeituanStatus = (): IntegrationStatusItem => {
  const apiBase = hasValue(process.env.MEITUAN_API_BASE_URL)
  const appId = hasValue(process.env.MEITUAN_APP_ID)
  const appSecret = hasValue(process.env.MEITUAN_APP_SECRET)
  const enabledByEnv = parseBooleanFlag(process.env.MEITUAN_INTEGRATION_ENABLED)
  const requiredEnvKeys = ['MEITUAN_API_BASE_URL', 'MEITUAN_APP_ID', 'MEITUAN_APP_SECRET']
  const missingEnvKeys = uniqueKeys([
    ...(apiBase ? [] : ['MEITUAN_API_BASE_URL']),
    ...(appId ? [] : ['MEITUAN_APP_ID']),
    ...(appSecret ? [] : ['MEITUAN_APP_SECRET']),
  ])
  const hints = ['若暂不接入，可设置 MEITUAN_INTEGRATION_ENABLED=false']

  if ((enabledByEnv ?? true) && apiBase && appId && appSecret) {
    return {
      key: 'meituan',
      status: 'connected',
      configured: true,
      message: '美团开放平台接入参数完整。',
      requiredEnvKeys,
      missingEnvKeys: [],
      hints,
    }
  }
  if (apiBase || appId || appSecret) {
    return {
      key: 'meituan',
      status: 'degraded',
      configured: false,
      message: '美团接入配置不完整（需 base/appId/appSecret）。',
      requiredEnvKeys,
      missingEnvKeys,
      hints,
    }
  }
  return {
    key: 'meituan',
    status: 'needs_config',
    configured: false,
    message: '未配置美团开放平台参数。',
    requiredEnvKeys,
    missingEnvKeys,
    hints,
  }
}

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const items = [
    resolveGaiaStatus(),
    resolveFinanceStatus(),
    resolveSupplyStatus(),
    resolveMeituanStatus(),
  ]

  return NextResponse.json({
    items,
    total: items.length,
    generatedAt: new Date().toISOString(),
  })
}
