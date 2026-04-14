import { useEffect, useId, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'

import { getBridgeApiBaseUrl, getDepositAddress, getRoutes } from '@/lib/bridge-api'
import { formatAssetAmountLabel, formatCount, humanizeKey } from '@/lib/format'
import {
  ApiConfigAlert,
  CardEmptyState,
  CopyableText,
  DetailList,
  LoadingCard,
  PageHeader,
} from '@/components/explorer/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function OverviewPage() {
  const routeFieldId = useId()
  const bridgeApiBaseUrl = getBridgeApiBaseUrl()
  const hasBridgeApiConfig = Boolean(bridgeApiBaseUrl)
  const routesQuery = useQuery({
    queryKey: ['routes'],
    queryFn: getRoutes,
    enabled: hasBridgeApiConfig,
  })

  const routes = routesQuery.data?.routes ?? []
  const defaultRouteId = routes[0]?.routeId ?? ''
  const [routeId, setRouteId] = useState(defaultRouteId)
  const [destinationAddress, setDestinationAddress] = useState('')
  const [submitted, setSubmitted] = useState<{
    routeId: string
    destinationAddress: string
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!routeId && defaultRouteId) {
      setRouteId(defaultRouteId)
    }
  }, [defaultRouteId, routeId])

  const selectedRoute = useMemo(
    () => routes.find((route) => route.routeId === routeId) ?? routes[0],
    [routeId, routes]
  )

  const generateQuery = useQuery({
    queryKey: [
      'gen',
      submitted?.routeId ?? '',
      submitted?.destinationAddress ?? '',
    ],
    queryFn: () => {
      const route = routes.find((item) => item.routeId === submitted?.routeId)
      if (!route || !submitted) {
        throw new Error('Select a supported route.')
      }

      return getDepositAddress({
        sourceChain: route.sourceChain,
        destinationChain: route.destinationChain,
        asset: route.asset,
        destinationAddress: submitted.destinationAddress,
      })
    },
    enabled: Boolean(hasBridgeApiConfig && submitted),
  })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Generate Deposit Address"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void routesQuery.refetch()
            }}
            disabled={!hasBridgeApiConfig || routesQuery.isFetching}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      {!hasBridgeApiConfig ? <ApiConfigAlert /> : null}

      {routesQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Routes request failed</AlertTitle>
          <AlertDescription>{routesQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {generateQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Deposit address request failed</AlertTitle>
          <AlertDescription>{generateQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-lg border border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Request new deposit wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()

                if (!routeId) {
                  setError('Select a route.')
                  return
                }

                if (!destinationAddress.trim()) {
                  setError('Destination address is required.')
                  return
                }

                setError('')
                setSubmitted({
                  routeId,
                  destinationAddress: destinationAddress.trim(),
                })
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={routeFieldId}>Route</FieldLabel>
                  <Select
                    value={routeId}
                    onValueChange={(value) => {
                      if (!value) {
                        return
                      }

                      setRouteId(value)
                    }}
                  >
                    <SelectTrigger id={routeFieldId} className="w-full">
                      <SelectValue
                        placeholder={routes.length ? 'Select route' : 'No routes available'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {routes.map((route) => (
                          <SelectItem key={route.routeId} value={route.routeId}>
                            {humanizeKey(route.sourceChain)} to{' '}
                            {humanizeKey(route.destinationChain)} ·{' '}
                            {route.asset.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="destination-address">
                    User address
                  </FieldLabel>
                  <Input
                    id="destination-address"
                    value={destinationAddress}
                    aria-invalid={error ? true : undefined}
                    placeholder="0x... or destination wallet"
                    onChange={(event) => {
                      setDestinationAddress(event.target.value)
                    }}
                  />
                  <FieldDescription>
                    {selectedRoute
                      ? `Generate a ${humanizeKey(selectedRoute.sourceChain)} deposit address that bridges into ${humanizeKey(selectedRoute.destinationChain)} for this destination wallet.`
                      : 'Load routes from the bridge API first.'}
                  </FieldDescription>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                </Field>
              </FieldGroup>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={!hasBridgeApiConfig || routesQuery.isLoading || generateQuery.isFetching}
                >
                  Generate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRouteId(defaultRouteId)
                    setDestinationAddress('')
                    setSubmitted(null)
                    setError('')
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Generated deposit wallet</CardTitle>
          </CardHeader>
          <CardContent>
            {generateQuery.isLoading ? (
              <LoadingCard />
            ) : generateQuery.data ? (
              <DetailList
                items={[
                  {
                    label: 'Deposit address',
                    value: (
                      <CopyableText
                        value={generateQuery.data.address}
                        label="Copy deposit address"
                      />
                    ),
                  },
                  { label: 'Status', value: humanizeKey(generateQuery.data.status) },
                  {
                    label: 'Route',
                    value: generateQuery.data.route || selectedRoute?.routeId || 'Unavailable',
                  },
                  {
                    label: 'Minimum amount',
                    value: formatAssetAmountLabel(
                      generateQuery.data.minimumAmount ?? selectedRoute?.minimumAmount,
                      selectedRoute?.sourceAsset
                    ),
                  },
                  {
                    label: 'Signatures',
                    value: formatCount(Object.keys(generateQuery.data.signatures).length),
                  },
                ]}
              />
            ) : (
              <CardEmptyState
                title="No deposit wallet generated"
                description="Choose a route, enter a user address, and generate a deposit address."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
