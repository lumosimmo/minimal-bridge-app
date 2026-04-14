export function homePath() {
  return '/'
}

export function quotePath(search?: URLSearchParams | string) {
  if (!search) {
    return '/quote'
  }

  const query = typeof search === 'string' ? search : search.toString()
  return query ? `/quote?${query}` : '/quote'
}

export function addressPath(address: string) {
  return `/addresses/${encodeURIComponent(address)}`
}

export function operationDetailPath(operationId: string) {
  return `/operations/${encodeURIComponent(operationId)}`
}

export function operationPath(address: string, operationId: string) {
  return `/addresses/${encodeURIComponent(address)}/operations/${encodeURIComponent(operationId)}`
}
