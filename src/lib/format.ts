const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const integerFormatter = new Intl.NumberFormat(undefined)
const decimalFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 8,
})

const assetDecimals: Record<string, number> = {
  eth: 18,
  ueth: 9,
  usdc: 6,
}

export function formatTimestamp(value?: string) {
  if (!value) {
    return 'Unavailable'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return dateTimeFormatter.format(date)
}

export function formatCount(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return '0'
  }

  return integerFormatter.format(value)
}

export function formatAmount(value?: string) {
  if (!value) {
    return '0'
  }

  const normalized = value.trim()

  if (!normalized) {
    return '0'
  }

  const [whole, fraction] = normalized.split('.')
  const sign = whole.startsWith('-') ? '-' : ''
  const unsignedWhole = sign ? whole.slice(1) : whole
  const formattedWhole = `${sign}${(unsignedWhole || '0').replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ','
  )}`

  if (!fraction) {
    return formattedWhole
  }

  return `${formattedWhole}.${fraction}`
}

function trimFraction(value: string) {
  return value.replace(/0+$/, '')
}

function formatBaseUnits(
  value: string,
  decimals: number,
  maxFractionDigits = Math.min(8, decimals)
) {
  const normalized = value.trim()
  if (!normalized) {
    return '0'
  }

  const sign = normalized.startsWith('-') ? '-' : ''
  const unsigned = sign ? normalized.slice(1) : normalized
  const digits = unsigned.replace(/^0+(?=\d)/, '') || '0'

  if (!/^\d+$/.test(digits)) {
    return formatAmount(value)
  }

  if (decimals <= 0) {
    return formatAmount(`${sign}${digits}`)
  }

  const padded = digits.padStart(decimals + 1, '0')
  const whole = padded.slice(0, -decimals)
  const fraction = padded.slice(-decimals)
  const visibleFraction = fraction.slice(0, maxFractionDigits)
  const truncatedFraction = trimFraction(visibleFraction)

  if (!truncatedFraction) {
    if (whole === '0' && /[1-9]/.test(fraction)) {
      return `<${decimalFormatter.format(Number(`0.${'0'.repeat(Math.max(0, maxFractionDigits - 1))}1`))}`
    }

    return formatAmount(`${sign}${whole}`)
  }

  return formatAmount(`${sign}${whole}.${truncatedFraction}`)
}

export function formatAssetAmount(value: string | undefined, asset: string | undefined) {
  if (!value) {
    return '0'
  }

  const decimals = asset ? assetDecimals[asset.toLowerCase()] : undefined
  if (decimals === undefined) {
    return formatAmount(value)
  }

  return formatBaseUnits(value, decimals)
}

export function formatAssetAmountLabel(value: string | undefined, asset: string | undefined) {
  const symbol = asset?.toUpperCase()
  const formatted = formatAssetAmount(value, asset)
  return symbol ? `${formatted} ${symbol}` : formatted
}

export function hasPositiveAmount(value?: string) {
  if (!value) {
    return false
  }

  const normalized = value.trim()
  return /^\d+$/.test(normalized) ? /[1-9]/.test(normalized) : Number(normalized) > 0
}

export function sumIntegerAmounts(...values: Array<string | undefined>) {
  return values.reduce((total, value) => {
    if (!value) {
      return total
    }

    const normalized = value.trim()
    if (!/^\d+$/.test(normalized)) {
      return total
    }

    return total + BigInt(normalized)
  }, 0n)
}

export function inferRouteAssets(sourceChain: string, destinationChain: string, asset: string) {
  const normalizedAsset = asset.toLowerCase()
  if (normalizedAsset !== 'eth') {
    return {
      sourceAsset: normalizedAsset,
      destinationAsset: normalizedAsset,
    }
  }

  if (sourceChain === 'ethereum' && destinationChain === 'hyperliquid') {
    return {
      sourceAsset: 'eth',
      destinationAsset: 'ueth',
    }
  }

  if (sourceChain === 'hyperliquid' && destinationChain === 'ethereum') {
    return {
      sourceAsset: 'ueth',
      destinationAsset: 'eth',
    }
  }

  return {
    sourceAsset: normalizedAsset,
    destinationAsset: normalizedAsset,
  }
}

export function formatHash(value?: string) {
  if (!value) {
    return 'Unavailable'
  }

  if (value.length <= 14) {
    return value
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

export function humanizeKey(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export function humanizeState(value: string) {
  return humanizeKey(value)
}
