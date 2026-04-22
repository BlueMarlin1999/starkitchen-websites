declare global {
  interface Window {
    __STARSHIP_CONFIG__?: {
      apiUrl?: string
      starshipAiUrl?: string
    }
  }
}

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const LEGACY_STARSHIP_AI_HOST = 'volunteers-gif-tsunami-publications.trycloudflare.com'
const LEGACY_STARSHIP_AI_DOMAIN_SUFFIX = '.trycloudflare.com'
const FALLBACK_STARSHIP_AI_PATH = '/dashboard/chat/'
const DEFAULT_STARSHIP_AI_ORIGIN = (process.env.NEXT_PUBLIC_STARSHIP_AI_FALLBACK_ORIGIN || 'https://starkitchenai.com').trim()
const getDefaultStarshipAiOrigin = () => stripTrailingSlash(DEFAULT_STARSHIP_AI_ORIGIN || 'https://starkitchenai.com')

const parseBooleanFlag = (value?: string) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false
  }
  return null
}

const shouldFallbackToInsiteAi = (hostname: string) =>
  hostname === LEGACY_STARSHIP_AI_HOST || hostname.endsWith(LEGACY_STARSHIP_AI_DOMAIN_SUFFIX)

const readExplicitApiUrl = () => {
  if (typeof window !== 'undefined' && window.__STARSHIP_CONFIG__?.apiUrl) {
    return window.__STARSHIP_CONFIG__.apiUrl
  }

  return process.env.NEXT_PUBLIC_API_URL || ''
}

const embeddedApiEnabledByEnv = parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_EMBEDDED_API)
const EMBEDDED_API_ENABLED = embeddedApiEnabledByEnv ?? true

const readExplicitStarshipAiUrl = () => {
  if (typeof window !== 'undefined' && window.__STARSHIP_CONFIG__?.starshipAiUrl) {
    return window.__STARSHIP_CONFIG__.starshipAiUrl
  }

  return process.env.NEXT_PUBLIC_STARSHIP_AI_URL || ''
}

export const hasExplicitApiUrl = () => Boolean(readExplicitApiUrl())

export const hasAvailableAuthService = () => hasExplicitApiUrl() || EMBEDDED_API_ENABLED

export const getApiBaseUrl = () => {
  const configured = readExplicitApiUrl()

  if (!configured) {
    return ''
  }

  const normalized = stripTrailingSlash(configured)
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const apiPath = normalizedPath.startsWith('/api/')
    ? normalizedPath.slice(4)
    : normalizedPath === '/api'
      ? ''
      : normalizedPath

  const baseUrl = getApiBaseUrl()
  return baseUrl ? `${baseUrl}${apiPath}` : `/api${apiPath}`
}

export const getStarshipAiUrl = () => {
  const configured = readExplicitStarshipAiUrl().trim()

  if (configured) {
    const normalized = stripTrailingSlash(configured)

    try {
      const configuredUrl = new URL(normalized)
      if (shouldFallbackToInsiteAi(configuredUrl.hostname)) {
        if (typeof window !== 'undefined' && window.location?.origin) {
          return `${stripTrailingSlash(window.location.origin)}${FALLBACK_STARSHIP_AI_PATH}`
        }
        return `${getDefaultStarshipAiOrigin()}${FALLBACK_STARSHIP_AI_PATH}`
      }
    } catch (error) {
      console.warn('Invalid STARSHIP AI URL, fallback to in-site chat.', error)
    }

    return normalized
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${stripTrailingSlash(window.location.origin)}${FALLBACK_STARSHIP_AI_PATH}`
  }

  return `${getDefaultStarshipAiOrigin()}${FALLBACK_STARSHIP_AI_PATH}`
}
