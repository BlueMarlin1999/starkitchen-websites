import { describe, expect, it } from 'vitest'
import { shouldEnableMessageCollapse } from '../../../../src/components/AgentLegion/message-content'

describe('src/components/AgentLegion/message-content.ts', () => {
  it('does not collapse short content', () => {
    expect(shouldEnableMessageCollapse('这是一个简短回复。')).toBe(false)
  })

  it('collapses long plain text by character length', () => {
    const longText = 'A'.repeat(900)
    expect(shouldEnableMessageCollapse(longText)).toBe(true)
  })

  it('collapses multiline content by line count', () => {
    const content = Array.from({ length: 18 }, (_, index) => `第${index + 1}行`).join('\n')
    expect(shouldEnableMessageCollapse(content)).toBe(true)
  })
})
