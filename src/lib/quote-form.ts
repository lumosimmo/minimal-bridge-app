import type { BridgeRoute } from '@/lib/bridge-api'

export type QuoteSearchState = {
  routeId: string
  destinationAddress: string
  amount: string
}

export function getRouteOption(routes: BridgeRoute[], routeId: string) {
  return routes.find((route) => route.routeId === routeId)
}

export function defaultQuoteSearchState(defaultRouteId = ''): QuoteSearchState {
  return {
    routeId: defaultRouteId,
    destinationAddress: '',
    amount: '',
  }
}

export function quoteStateFromSearchParams(
  searchParams: URLSearchParams,
  routes: BridgeRoute[]
): QuoteSearchState {
  const initial = defaultQuoteSearchState(routes[0]?.routeId)
  const routeId = searchParams.get('route') ?? initial.routeId

  return {
    routeId: getRouteOption(routes, routeId) ? routeId : initial.routeId,
    destinationAddress: searchParams.get('destinationAddress') ?? '',
    amount: searchParams.get('amount') ?? '',
  }
}

export function quoteSearchParamsFromState(state: QuoteSearchState) {
  const params = new URLSearchParams()

  if (state.routeId) {
    params.set('route', state.routeId)
  }
  if (state.destinationAddress.trim()) {
    params.set('destinationAddress', state.destinationAddress.trim())
  }
  if (state.amount.trim()) {
    params.set('amount', state.amount.trim())
  }

  return params
}
