import { describe, expect, it } from 'vitest'

import {
  formatAssetAmount,
  formatAssetAmountLabel,
  hasPositiveAmount,
  inferRouteAssets,
  sumIntegerAmounts,
} from './format'

describe('asset formatting', () => {
  it('formats ethereum wei into ETH units', () => {
    expect(formatAssetAmountLabel('10000000000000000', 'eth')).toBe('0.01 ETH')
  })

  it('formats hyperliquid base units into UETH units', () => {
    expect(formatAssetAmountLabel('9900000', 'ueth')).toBe('0.0099 UETH')
  })

  it('shows tiny values without rounding them down to zero', () => {
    expect(formatAssetAmount('5000', 'eth')).toBe('<0.00000001')
  })

  it('detects positive amount strings', () => {
    expect(hasPositiveAmount('0')).toBe(false)
    expect(hasPositiveAmount('0000')).toBe(false)
    expect(hasPositiveAmount('42')).toBe(true)
  })

  it('sums integer base-unit amounts', () => {
    expect(sumIntegerAmounts('10', undefined, '25', '0')).toBe(35n)
  })

  it('infers eth and ueth route assets from chain direction', () => {
    expect(inferRouteAssets('ethereum', 'hyperliquid', 'eth')).toEqual({
      sourceAsset: 'eth',
      destinationAsset: 'ueth',
    })
    expect(inferRouteAssets('hyperliquid', 'ethereum', 'eth')).toEqual({
      sourceAsset: 'ueth',
      destinationAsset: 'eth',
    })
  })
})
