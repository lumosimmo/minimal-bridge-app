import { useEffect, useId, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  getBridgeApiBaseUrl,
  getDepositAddress,
  getRoutes,
  type BridgeRoute,
} from '@/lib/bridge-api'
import {
  formatAssetAmountLabel,
  formatCount,
  formatRouteLabel,
  humanizeKey,
} from '@/lib/format'
import {
  ApiConfigAlert,
  CardEmptyState,
  CopyableText,
  DetailList,
  LoadingCard,
} from '@/components/explorer/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
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
    route: BridgeRoute
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
  const routeItems = useMemo(
    () =>
      routes.map((route) => ({
        value: route.routeId,
        label: formatRouteLabel(route),
      })),
    [routes]
  )
  const submittedRoute = submitted?.route

  const generateQuery = useQuery({
    queryKey: [
      'gen',
      submitted?.route.routeId ?? '',
      submitted?.destinationAddress ?? '',
    ],
    queryFn: () => {
      if (!submitted) {
        throw new Error('Select a supported route.')
      }

      return getDepositAddress({
        sourceChain: submitted.route.sourceChain,
        destinationChain: submitted.route.destinationChain,
        asset: submitted.route.asset,
        destinationAddress: submitted.destinationAddress,
      })
    },
    enabled: Boolean(hasBridgeApiConfig && submitted),
  })

  return (
    <div className="flex flex-col gap-4">
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

      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <p className="px-4 py-2 text-center text-3xl font-semibold leading-tight tracking-tight text-foreground sm:px-6 sm:py-4 sm:text-4xl">
          Start with a deposit address
        </p>
        <Card className="rounded-lg border border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Get deposit wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()

                if (!selectedRoute) {
                  setError('Select a route.')
                  return
                }

                if (!destinationAddress.trim()) {
                  setError('Destination address is required.')
                  return
                }

                setError('')
                setSubmitted({
                  route: selectedRoute,
                  destinationAddress: destinationAddress.trim(),
                })
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={routeFieldId}>Route</FieldLabel>
                  <Select
                    items={routeItems}
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
                            {formatRouteLabel(route)}
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
                    placeholder="0x..."
                    onChange={(event) => {
                      setDestinationAddress(event.target.value)
                    }}
                  />
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                </Field>
              </FieldGroup>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={!hasBridgeApiConfig || routesQuery.isLoading || generateQuery.isFetching}
                >
                  Get Wallet
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
            <CardTitle>Deposit wallet</CardTitle>
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
                    value: submittedRoute
                      ? formatRouteLabel(submittedRoute)
                      : generateQuery.data.route || 'Unavailable',
                  },
                  {
                    label: 'Minimum amount',
                    value: formatAssetAmountLabel(
                      generateQuery.data.minimumAmount ?? submittedRoute?.minimumAmount,
                      submittedRoute?.sourceAsset
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
                description="Choose a route, enter a user address, and generate or look up a deposit address."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
