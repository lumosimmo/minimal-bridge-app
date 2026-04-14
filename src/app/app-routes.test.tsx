import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { appRoutes } from '@/app/routes'

const operationsPayload = {
  addresses: [
    {
      sourceCoinType: 'ethereum',
      destinationChain: 'hyperliquid',
      asset: 'eth',
      destinationAddress: '0x00000000000000000000000000000000000000aa',
      address: '0x00000000000000000000000000000000000000bb',
      signatures: {
        bridge: 'sig',
      },
    },
  ],
  operations: [
    {
      opCreatedAt: '2026-04-13T00:01:00Z',
      operationId: 'deposit:older',
      protocolAddress: '0x00000000000000000000000000000000000000bb',
      sourceAddress: '0x00000000000000000000000000000000000000ce',
      destinationAddress: '0x00000000000000000000000000000000000000aa',
      sourceChain: 'ethereum',
      destinationChain: 'hyperliquid',
      sourceAmount: '5000000000000000',
      destinationAmount: '4900000',
      destinationFeeAmount: '100000',
      sweepFeeAmount: '4000',
      asset: 'eth',
      state: 'source_swept',
      sourceTxHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      sourceTxConfirmations: 2,
      destinationTxHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      feeDetails: {
        activationFeeUsdc: '900',
        activationFeeAssetEquivalent: '2500',
        feeMultiplierBps: 120,
      },
    },
    {
      opCreatedAt: '2026-04-13T00:03:00Z',
      operationId: 'deposit:abc',
      protocolAddress: '0x00000000000000000000000000000000000000bb',
      sourceAddress: '0x00000000000000000000000000000000000000cc',
      destinationAddress: '0x00000000000000000000000000000000000000aa',
      sourceChain: 'ethereum',
      destinationChain: 'hyperliquid',
      sourceAmount: '10000000000000000',
      destinationAmount: '9900000',
      destinationFeeAmount: '100000',
      sweepFeeAmount: '5000',
      asset: 'eth',
      state: 'source_confirmed',
      sourceTxHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      sourceTxConfirmations: 4,
      destinationTxHash:
        '0x2222222222222222222222222222222222222222222222222222222222222222',
      feeDetails: {
        activationFeeUsdc: '1000',
        activationFeeAssetEquivalent: '3000',
        feeMultiplierBps: 125,
      },
    },
  ],
}

const operationDetailPayload = {
  operation: operationsPayload.operations[1],
  binding: {
    bindingId: 'binding-deposit-abc',
    routeId: 'ethereum-hyperliquid-eth',
    direction: 'deposit',
    sourceChain: 'ethereum',
    destinationChain: 'hyperliquid',
    asset: 'eth',
    sourceAsset: 'eth',
    destinationAsset: 'ueth',
    destinationAddress: '0x00000000000000000000000000000000000000aa',
    protocolAddress: '0x00000000000000000000000000000000000000bb',
    minimumAmount: '1000000000000000',
    signatures: {
      bridge: 'sig',
    },
  },
}

const quotePayload = {
  protocolAddress: '0x00000000000000000000000000000000000000bb',
  direction: 'deposit',
  sourceChain: 'ethereum',
  destinationChain: 'hyperliquid',
  asset: 'eth',
  sourceAmount: '10000000000000000',
  destinationAmount: '9900000',
  destinationFeeAmount: '100000',
  sweepFeeAmount: '5000',
  payoutFeeAmount: '0',
  flatFeeAmount: '0',
  totalFeeAmount: '105000',
  activationRequired: true,
  feeDetails: {
    activationFeeUsdc: '1000',
    activationFeeAssetEquivalent: '3000',
    activationFeeAsset: 'eth',
    sweepFeeAmount: '5000',
    payoutFeeAmount: '0',
    flatFeeAmount: '0',
    totalFeeAmount: '105000',
    activationFeeMultiplierBps: 125,
    sweepGasMultiplierBps: 110,
    payoutGasMultiplierBps: 100,
  },
  pricing: {
    ethUsdcMid: '3200.5',
    bestBid: '3199',
    bestAsk: '3202',
    spreadBps: 10,
    observedAt: '2026-04-13T00:00:00Z',
    expiresAt: '2026-04-13T00:00:30Z',
  },
  status: 'OK',
}

const routesPayload = {
  routes: [
    {
      routeId: 'ethereum-hyperliquid-eth',
      direction: 'deposit',
      sourceChain: 'ethereum',
      destinationChain: 'hyperliquid',
      asset: 'eth',
      sourceAsset: 'eth',
      destinationAsset: 'ueth',
      minimumAmount: '1000000000000000',
    },
    {
      routeId: 'hyperliquid-ethereum-eth',
      direction: 'withdrawal',
      sourceChain: 'hyperliquid',
      destinationChain: 'ethereum',
      asset: 'eth',
      sourceAsset: 'ueth',
      destinationAsset: 'eth',
      minimumAmount: '700000',
    },
  ],
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function renderRoute(
  initialEntries: string[],
  fetchImpl: (input: RequestInfo | URL) => Promise<Response>,
  apiUrl = 'http://bridge.test'
) {
  vi.stubEnv('VITE_MINIMAL_BRIDGE_API_URL', apiUrl)
  const fetchMock = vi.fn(fetchImpl)
  vi.stubGlobal('fetch', fetchMock)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter(appRoutes, {
    initialEntries,
  })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )

  return {
    ...result,
    fetchMock,
    router,
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('app routes', () => {
  it('renders overview from public routes metadata', async () => {
    renderRoute(['/' ], async (input) => {
      const url = input.toString()
      if (url.includes('/routes')) {
        return jsonResponse(routesPayload)
      }

      throw new Error(`Unexpected url ${url}`)
    })

    expect(
      await screen.findByText('Get deposit wallet')
    ).toBeInTheDocument()
    expect(await screen.findByText('Deposit wallet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Choose a route, enter a user address, and generate or look up a deposit address.'
      )
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
    const routeSelect = screen.getByRole('combobox', { name: 'Route' })
    expect(routeSelect).toHaveTextContent('Ethereum to Hyperliquid · ETH')
    expect(routeSelect).not.toHaveTextContent('ethereum-hyperliquid-eth')
  })

  it('generates a deposit address from the home page', async () => {
    const user = userEvent.setup()

    renderRoute(['/' ], async (input) => {
      const url = input.toString()
      if (url.includes('/routes')) {
        return jsonResponse(routesPayload)
      }
      if (url.includes('/gen/ethereum/hyperliquid/eth/0xabc')) {
        return jsonResponse({
          address: '0x00000000000000000000000000000000000000bb',
          signatures: { bridge: 'sig' },
          status: 'ok',
          minimumAmount: '1000000000000000',
          route: 'ethereum-hyperliquid-eth',
        })
      }

      throw new Error(`Unexpected url ${url}`)
    })

    await screen.findByText('Get deposit wallet')
    fireEvent.change(screen.getByLabelText('User address'), {
      target: { value: '0xabc' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Get Wallet' }))

    expect(await screen.findByText('Deposit address')).toBeInTheDocument()
    expect(await screen.findByText('0x00000000000000000000000000000000000000bb')).toBeInTheDocument()
    const depositWalletCard = screen
      .getByText('Deposit wallet')
      .closest('[data-slot="card"]')
    expect(depositWalletCard).not.toBeNull()
    expect(within(depositWalletCard as HTMLElement).getByText('Ethereum to Hyperliquid · ETH')).toBeInTheDocument()
    expect(within(depositWalletCard as HTMLElement).getByText('0.001 ETH')).toBeInTheDocument()

    const routeSelect = screen.getByRole('combobox', { name: 'Route' })
    await user.click(routeSelect)
    await user.click(
      await screen.findByRole('option', { name: 'Hyperliquid to Ethereum · ETH' })
    )

    await waitFor(() => {
      expect(routeSelect).toHaveTextContent('Hyperliquid to Ethereum · ETH')
    })
    expect(within(depositWalletCard as HTMLElement).getByText('Ethereum to Hyperliquid · ETH')).toBeInTheDocument()
    expect(within(depositWalletCard as HTMLElement).getByText('0.001 ETH')).toBeInTheDocument()
    expect(within(depositWalletCard as HTMLElement).queryByText('1,000,000 UETH')).not.toBeInTheDocument()
  })

  it('loads bindings and operations for an address route', async () => {
    renderRoute(['/addresses/0x00000000000000000000000000000000000000aa'], async (input) => {
      const url = input.toString()
      if (url.includes('/bindings?destinationAddress=0x00000000000000000000000000000000000000aa')) {
        return jsonResponse({ bindings: [operationDetailPayload.binding] })
      }
      if (url.includes('/bindings/0x00000000000000000000000000000000000000aa')) {
        return jsonResponse({ error: 'not found' }, 404)
      }
      if (url.includes('/operations/0x00000000000000000000000000000000000000aa')) {
        return jsonResponse(operationsPayload)
      }

      throw new Error(`Unexpected url ${url}`)
    })

    expect(await screen.findByText('Bound protocol addresses')).toBeInTheDocument()
    expect(await screen.findByText('deposit:abc')).toBeInTheDocument()
    expect(await screen.findByText('1 signatures')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Address', current: 'page' })).toBeInTheDocument()
    expect(screen.getByText('Bound protocol addresses').closest('[data-slot=\"card\"]')).toBeNull()
    expect(screen.getByText('Operation history').closest('[data-slot=\"card\"]')).toBeNull()
  })

  it('shows empty state for an address with no data', async () => {
    renderRoute(['/addresses/0xempty'], async (input) => {
      const url = input.toString()
      if (url.includes('/bindings?destinationAddress=0xempty')) {
        return jsonResponse({ bindings: [] })
      }
      if (url.includes('/bindings/0xempty')) {
        return jsonResponse({ error: 'not found' }, 404)
      }
      if (url.includes('/operations/0xempty')) {
        return jsonResponse({ addresses: [], operations: [] })
      }

      throw new Error(`Unexpected url ${url}`)
    })

    expect(await screen.findByText('No bindings found')).toBeInTheDocument()
    expect(await screen.findByText('No operations found')).toBeInTheDocument()
  })

  it('renders operation detail from the dedicated operation endpoint', async () => {
    renderRoute(['/operations/deposit%3Aabc'], async (input) => {
      const url = input.toString()
      if (url.includes('/operations/by-id?operationId=deposit%3Aabc')) {
        return jsonResponse(operationDetailPayload)
      }
      if (url.includes('/operations/0x00000000000000000000000000000000000000bb')) {
        return jsonResponse(operationsPayload)
      }

      throw new Error(`Unexpected url ${url}`)
    })

    expect(await screen.findByText('Operation detail')).toBeInTheDocument()
    expect(await screen.findByText('Operation fields')).toBeInTheDocument()
    expect((await screen.findAllByText('deposit:abc')).length).toBeGreaterThan(0)
  })

  it('shows not found when the operation id is absent from the address payload', async () => {
    renderRoute(['/operations/missing'], async (input) => {
      const url = input.toString()
      if (url.includes('/operations/by-id?operationId=missing')) {
        return jsonResponse({ error: 'operation is not found' }, 404)
      }

      throw new Error(`Unexpected url ${url}`)
    })

    expect(await screen.findByText('Operation not found')).toBeInTheDocument()
  })

  it('sorts operations before showing latest activity and adjacent navigation', async () => {
    renderRoute(['/operations/deposit%3Aolder'], async (input) => {
      const url = input.toString()
      if (url.includes('/operations/by-id?operationId=deposit%3Aolder')) {
        return jsonResponse({
          ...operationDetailPayload,
          operation: operationsPayload.operations[0],
        })
      }
      if (url.includes('/operations/0x00000000000000000000000000000000000000bb')) {
        return jsonResponse(operationsPayload)
      }

      throw new Error(`Unexpected url ${url}`)
    })

    expect(await screen.findByText('Operation detail')).toBeInTheDocument()
    expect(await screen.findByText('Adjacent operations')).toBeInTheDocument()
    const latestButton = screen.getByRole('button', { name: 'Next newer operation' })
    await waitFor(() => {
      expect(latestButton).toBeEnabled()
    })

    fireEvent.click(latestButton)
    expect((await screen.findAllByText('deposit:abc')).length).toBeGreaterThan(0)
  })

  it('validates quote inputs before querying', async () => {
    renderRoute(['/quote'], async (input) => {
      const url = input.toString()
      if (url.includes('/routes')) {
        return jsonResponse(routesPayload)
      }

      throw new Error(`Unexpected url ${url}`)
    })

    fireEvent.click(await screen.findByText('Load quote'))
    expect(
      await screen.findByText('Destination address and amount are required.')
    ).toBeInTheDocument()
  })

  it('renders quote results from URL search params', async () => {
    renderRoute(
      [
        '/quote?route=ethereum-hyperliquid-eth&destinationAddress=0xabc&amount=10000000000000000',
      ],
      async (input) => {
        const url = input.toString()
        if (url.includes('/routes')) {
          return jsonResponse(routesPayload)
        }
        if (url.includes('/quote/ethereum/hyperliquid/eth/0xabc?amount=10000000000000000')) {
          return jsonResponse(quotePayload)
        }

        throw new Error(`Unexpected url ${url}`)
      }
    )

    expect(await screen.findByText('Quote result')).toBeInTheDocument()
    expect(await screen.findByText('Fee breakdown')).toBeInTheDocument()
    expect(await screen.findByText('Mid 3200.5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
    expect(screen.getByRole('combobox', { name: 'Route' })).toBeInTheDocument()
  })

  it('renders overview placeholders when the API URL is missing', async () => {
    const { fetchMock } = renderRoute(
      ['/'],
      async () => {
        throw new Error('fetch should not be called')
      },
      ''
    )

    expect(await screen.findByText('Connect the bridge API')).toBeInTheDocument()
    expect(screen.getByText('Start with a deposit address')).toBeInTheDocument()
    expect(screen.getByText('Get deposit wallet')).toBeInTheDocument()
    expect(screen.getByText('Deposit wallet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders quote placeholders when the API URL is missing', async () => {
    const { fetchMock } = renderRoute(
      ['/quote'],
      async () => {
        throw new Error('fetch should not be called')
      },
      ''
    )

    expect(await screen.findByText('Connect the bridge API')).toBeInTheDocument()
    expect(screen.getByText('Quote result')).toBeInTheDocument()
    expect(screen.getByText('Fee breakdown')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
