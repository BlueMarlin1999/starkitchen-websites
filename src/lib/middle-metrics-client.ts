import { MiddleMetricKey, MiddleMetricsPayload } from '@/lib/middle-metrics'
import { buildApiUrl } from '@/lib/runtime-config'

const buildAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

const parseApiResponse = async <T>(response: Response): Promise<T> => {
  if (response.ok) return (await response.json()) as T
  const payload = await response.json().catch(() => ({}))
  const message =
    payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : `请求失败 (${response.status})`
  throw new Error(message)
}

export const fetchMiddleMetrics = async (token: string) => {
  const response = await fetch(buildApiUrl('/middle/metrics'), {
    method: 'GET',
    headers: buildAuthHeaders(token),
    credentials: 'include',
    cache: 'no-store',
  })
  return parseApiResponse<MiddleMetricsPayload>(response)
}

export const saveMiddleManualMetric = async (
  token: string,
  payload: {
    metricKey: MiddleMetricKey
    value: number
    note?: string
  }
) => {
  const response = await fetch(buildApiUrl('/middle/metrics'), {
    method: 'POST',
    headers: buildAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return parseApiResponse<{ ok: true; message: string; payload: MiddleMetricsPayload }>(response)
}

export const clearMiddleManualMetric = async (token: string, metricKey: MiddleMetricKey) => {
  const response = await fetch(buildApiUrl('/middle/metrics'), {
    method: 'DELETE',
    headers: buildAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ metricKey }),
  })
  return parseApiResponse<{ ok: true; message: string; payload: MiddleMetricsPayload }>(response)
}
