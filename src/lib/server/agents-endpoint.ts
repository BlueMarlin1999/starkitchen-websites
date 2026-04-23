const stripTrailingSlash = (value: string) => value.trim().replace(/\/+$/, '')

export const getAgentsApiBaseUrl = (): string => {
  const configured = process.env.AGENTS_API_URL

  if (!configured || configured.trim().length === 0) {
    throw new Error('AGENTS_API_URL environment variable is required')
  }

  return stripTrailingSlash(configured)
}
