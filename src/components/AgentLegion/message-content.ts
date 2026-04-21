const LONG_MESSAGE_MAX_CHARS = 1400
const LONG_MESSAGE_MAX_LINES = 26

export const shouldEnableMessageCollapse = (content: string) => {
  const normalized = content.trim()
  if (!normalized) return false
  const lineCount = normalized.split('\n').length
  return normalized.length > LONG_MESSAGE_MAX_CHARS || lineCount > LONG_MESSAGE_MAX_LINES
}
