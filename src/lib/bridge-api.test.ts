import { afterEach, describe, expect, it, vi } from 'vitest'

import * as api from './bridge-api'

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('bridge api helper', () => {
  it('keeps the missing env error explicit', async () => {
    vi.stubEnv('VITE_MINIMAL_BRIDGE_API_URL', '')
    vi.stubGlobal('fetch', vi.fn())

    await expect(api.getRoutes()).rejects.toThrow(
      'Missing VITE_MINIMAL_BRIDGE_API_URL'
    )
  })

  it('surfaces backend error payloads on non-200 responses', async () => {
    vi.stubEnv('VITE_MINIMAL_BRIDGE_API_URL', 'http://bridge.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'bad request' }, 400))
    )

    await expect(api.getRoutes()).rejects.toThrow('bad request')
  })

  it('encodes quote path params and amount correctly', async () => {
    vi.stubEnv('VITE_MINIMAL_BRIDGE_API_URL', 'http://bridge.test')
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await api.getQuote({
      sourceChain: 'ethereum',
      destinationChain: 'hyperliquid',
      asset: 'eth',
      destinationAddress: '0xabc',
      amount: '1000',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://bridge.test/quote/ethereum/hyperliquid/eth/0xabc?amount=1000',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
        },
      })
    )
  })

  it('encodes generate-address path params correctly', async () => {
    vi.stubEnv('VITE_MINIMAL_BRIDGE_API_URL', 'http://bridge.test')
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await api.getDepositAddress({
      sourceChain: 'ethereum',
      destinationChain: 'hyperliquid',
      asset: 'eth',
      destinationAddress: '0xabc',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://bridge.test/gen/ethereum/hyperliquid/eth/0xabc',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
        },
      })
    )
  })

  it('encodes operation id lookups as query params', async () => {
    vi.stubEnv('VITE_MINIMAL_BRIDGE_API_URL', 'http://bridge.test')
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await api.getOperationById('withdrawal:0xabc:1')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://bridge.test/operations/by-id?operationId=withdrawal%3A0xabc%3A1',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
        },
      })
    )
  })

  it('returns null for optional binding lookups on 404', async () => {
    vi.stubEnv('VITE_MINIMAL_BRIDGE_API_URL', 'http://bridge.test')
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'not found' }, 404)))

    await expect(api.getBindingByProtocolAddress('0xabc')).resolves.toBeNull()
  })
})
