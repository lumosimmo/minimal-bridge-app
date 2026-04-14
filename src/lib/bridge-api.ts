export function getBridgeApiBaseUrl() {
  const envApiUrl = import.meta.env.VITE_MINIMAL_BRIDGE_API_URL?.trim()
  return envApiUrl ? envApiUrl.replace(/\/+$/, '') : undefined
}

type ApiErrorPayload = {
  error?: string
}

export type WithdrawalQueueSweep = {
  state: string
  reason?: string
  transferId?: string
  nonce?: number
  txHash?: string
  submittedAt?: string
  updatedAt?: string
}

export type WithdrawalQueuePayout = {
  state: string
  nonce?: number
  txHash?: string
  createdAt?: string
  updatedAt?: string
}

export type GenerateAddressResponse = {
  address: string
  signatures: Record<string, string>
  status: string
  minimumAmount?: string
  route?: string
}

export type WithdrawalQueueItem = {
  createdAt: string
  updatedAt: string
  operationId: string
  bindingId: string
  protocolAddress?: string
  destinationAddress: string
  sourceAmount: string
  destinationAmount: string
  sourceTxHash?: string
  sourceTxConfirmations?: number
  operationState: string
  phase: string
  sweep?: WithdrawalQueueSweep
  payout?: WithdrawalQueuePayout
}

export type OperationAddress = {
  sourceCoinType: string
  destinationChain: string
  asset: string
  destinationAddress: string
  address: string
  signatures: Record<string, string>
}

export type OperationFeeDetails = {
  activationFeeUsdc?: string
  activationFeeAssetEquivalent?: string
  feeMultiplierBps?: number
}

export type OperationView = {
  opCreatedAt: string
  operationId: string
  protocolAddress: string
  sourceAddress: string
  destinationAddress: string
  sourceChain: string
  destinationChain: string
  sourceAmount: string
  destinationAmount: string
  destinationFeeAmount: string
  sweepFeeAmount: string
  asset: string
  state: string
  sourceTxHash?: string
  sourceTxConfirmations: number
  destinationTxHash?: string
  feeDetails?: OperationFeeDetails
}

export type OperationsResponse = {
  addresses: OperationAddress[]
  operations: OperationView[]
}

export type BindingLookupView = {
  bindingId: string
  routeId: string
  direction: string
  sourceChain: string
  destinationChain: string
  asset: string
  sourceAsset: string
  destinationAsset: string
  destinationAddress: string
  protocolAddress: string
  minimumAmount: string
  signatures: Record<string, string>
}

export type BindingResponse = {
  binding: BindingLookupView
}

export type BindingsResponse = {
  bindings: BindingLookupView[]
}

export type OperationDetailResponse = {
  operation: OperationView
  binding: BindingLookupView
  withdrawalQueue?: WithdrawalQueueItem
}

export type BridgeRoute = {
  routeId: string
  direction: string
  sourceChain: string
  destinationChain: string
  asset: string
  sourceAsset: string
  destinationAsset: string
  minimumAmount: string
}

export type RoutesResponse = {
  routes: BridgeRoute[]
}

export type QuoteResponse = {
  protocolAddress: string
  direction: string
  sourceChain: string
  destinationChain: string
  asset: string
  sourceAmount: string
  destinationAmount: string
  destinationFeeAmount: string
  sweepFeeAmount: string
  payoutFeeAmount: string
  flatFeeAmount: string
  totalFeeAmount: string
  activationRequired: boolean
  feeDetails: {
    activationFeeUsdc: string
    activationFeeAssetEquivalent: string
    activationFeeAsset: string
    sweepFeeAmount: string
    payoutFeeAmount: string
    flatFeeAmount: string
    totalFeeAmount: string
    activationFeeMultiplierBps: number
    sweepGasMultiplierBps: number
    payoutGasMultiplierBps: number
  }
  pricing: {
    ethUsdcMid: string
    bestBid?: string
    bestAsk?: string
    spreadBps: number
    observedAt: string
    expiresAt: string
  }
  status: string
}

async function fetchJson<T>(path: string): Promise<T> {
  const bridgeApiBaseUrl = getBridgeApiBaseUrl()

  if (!bridgeApiBaseUrl) {
    throw new Error(
      'Missing VITE_MINIMAL_BRIDGE_API_URL. Add it to your environment and restart Vite.'
    )
  }

  const response = await fetch(`${bridgeApiBaseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined

    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = undefined
    }

    throw new Error(payload?.error || `Request failed with ${response.status}`)
  }

  return (await response.json()) as T
}

async function fetchOptionalJson<T>(path: string): Promise<T | null> {
  const bridgeApiBaseUrl = getBridgeApiBaseUrl()

  if (!bridgeApiBaseUrl) {
    throw new Error(
      'Missing VITE_MINIMAL_BRIDGE_API_URL. Add it to your environment and restart Vite.'
    )
  }

  const response = await fetch(`${bridgeApiBaseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined

    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = undefined
    }

    throw new Error(payload?.error || `Request failed with ${response.status}`)
  }

  return (await response.json()) as T
}

export function getOperations(address: string) {
  return fetchJson<OperationsResponse>(`/operations/${encodeURIComponent(address)}`)
}

export function getDepositAddress({
  sourceChain,
  destinationChain,
  asset,
  destinationAddress,
}: {
  sourceChain: string
  destinationChain: string
  asset: string
  destinationAddress: string
}) {
  return fetchJson<GenerateAddressResponse>(
    `/gen/${encodeURIComponent(sourceChain)}/${encodeURIComponent(destinationChain)}/${encodeURIComponent(asset)}/${encodeURIComponent(destinationAddress)}`
  )
}

export function getOperationById(operationId: string) {
  const params = new URLSearchParams({
    operationId,
  })

  return fetchJson<OperationDetailResponse>(`/operations/by-id?${params.toString()}`)
}

export function getBindingByProtocolAddress(protocolAddress: string) {
  return fetchOptionalJson<BindingResponse>(`/bindings/${encodeURIComponent(protocolAddress)}`)
}

export function getBindingsByDestinationAddress(destinationAddress: string) {
  const params = new URLSearchParams({
    destinationAddress,
  })

  return fetchOptionalJson<BindingsResponse>(`/bindings?${params.toString()}`)
}

export function getRoutes() {
  return fetchJson<RoutesResponse>('/routes')
}

export function getQuote({
  sourceChain,
  destinationChain,
  asset,
  destinationAddress,
  amount,
}: {
  sourceChain: string
  destinationChain: string
  asset: string
  destinationAddress: string
  amount: string
}) {
  const params = new URLSearchParams({
    amount,
  })

  return fetchJson<QuoteResponse>(
    `/quote/${encodeURIComponent(sourceChain)}/${encodeURIComponent(destinationChain)}/${encodeURIComponent(asset)}/${encodeURIComponent(destinationAddress)}?${params.toString()}`
  )
}
