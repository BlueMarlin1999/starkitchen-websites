import { describe, expect, it } from 'vitest'
import {
  applyMiddleManualOverrides,
  buildMiddleAutoMetricCards,
  middleMetricKeySchema,
  toMiddleManualHistoryItems,
} from '@/lib/middle-metrics'

describe('src/lib/middle-metrics.ts', () => {
  it('builds the expected 10 core metrics for middle dashboard', () => {
    const cards = buildMiddleAutoMetricCards(['global'])
    expect(cards).toHaveLength(10)
    expect(cards.every((item) => item.source === 'auto')).toBe(true)
    expect(cards.every((item) => item.displayValue.length > 0)).toBe(true)
  })

  it('applies latest manual entry as active value and keeps formatted history', () => {
    const cards = buildMiddleAutoMetricCards(['global'])
    const entries = [
      {
        id: '1',
        metricKey: middleMetricKeySchema.parse('food-cost-rate'),
        value: 32.4,
        note: '来源：人工校准',
        actorId: 'SK00001',
        actorName: '徐嘉宁',
        actorRole: 'manager',
        createdAt: '2026-04-18T10:00:00.000Z',
      },
      {
        id: '2',
        metricKey: middleMetricKeySchema.parse('food-cost-rate'),
        value: 31.8,
        note: '来源：晚间复核',
        actorId: 'SK00001',
        actorName: '徐嘉宁',
        actorRole: 'manager',
        createdAt: '2026-04-18T12:00:00.000Z',
      },
    ]
    const applied = applyMiddleManualOverrides(cards, entries)
    const foodCostRate = applied.find((item) => item.key === 'food-cost-rate')
    expect(foodCostRate?.source).toBe('manual')
    expect(foodCostRate?.value).toBe(31.8)
    expect(foodCostRate?.displayValue).toContain('%')

    const history = toMiddleManualHistoryItems(entries)
    expect(history[0].createdAt).toBe('2026-04-18T12:00:00.000Z')
    expect(history[0].displayValue).toContain('%')
  })
})
