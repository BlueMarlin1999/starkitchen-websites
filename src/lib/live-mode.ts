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

const readStrictLiveModeFlag = () => {
  const publicFlag = parseBooleanFlag(process.env.NEXT_PUBLIC_STRICT_LIVE_MODE)
  if (publicFlag !== null) return publicFlag
  const serverFlag = parseBooleanFlag(process.env.STRICT_LIVE_MODE)
  if (serverFlag !== null) return serverFlag
  return true
}

const readDemoFeatureFlag = () => {
  const publicFlag = parseBooleanFlag(process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE)
  if (publicFlag !== null) return publicFlag
  const legacyFlag = parseBooleanFlag(process.env.NEXT_PUBLIC_AGENTS_DEMO_MODE)
  if (legacyFlag !== null) return legacyFlag
  return false
}

export const isStrictLiveMode = () => readStrictLiveModeFlag()

export const isDemoFeatureEnabled = () => {
  if (isStrictLiveMode()) return false
  return readDemoFeatureFlag()
}

export const isSeedFallbackAllowed = () => !isStrictLiveMode()
