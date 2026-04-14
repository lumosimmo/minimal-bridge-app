import { useEffect, useId, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { getBridgeApiBaseUrl, getQuote, getRoutes } from '@/lib/bridge-api'
import {
  formatAssetAmountLabel,
  formatTimestamp,
  hasPositiveAmount,
  humanizeKey,
} from '@/lib/format'
import {
  defaultQuoteSearchState,
  getRouteOption,
  quoteSearchParamsFromState,
  quoteStateFromSearchParams,
} from '@/lib/quote-form'
import { homePath, quotePath } from '@/lib/routes'
import {
  ApiConfigAlert,
  CardEmptyState,
  CopyableText,
  DetailList,
  LoadingDetailList,
  LoadingCard,
  PageHeader,
} from '@/components/explorer/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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

export function QuotePage() {
  const navigate = useNavigate()
  const routeFieldId = useId()
  const [searchParams] = useSearchParams()
  const bridgeApiBaseUrl = getBridgeApiBaseUrl()
  const hasBridgeApiConfig = Boolean(bridgeApiBaseUrl)
  const routesQuery = useQuery({
    queryKey: ['routes'],
    queryFn: getRoutes,
    enabled: hasBridgeApiConfig,
  })
  const routeOptions = routesQuery.data?.routes ?? []
  const initialState = useMemo(
    () => quoteStateFromSearchParams(searchParams, routeOptions),
    [routeOptions, searchParams]
  )
  const [formState, setFormState] = useState(initialState)
  const [error, setError] = useState('')

  const selectedRoute = getRouteOption(routeOptions, initialState.routeId) ?? routeOptions[0]
  const formSelectedRoute = getRouteOption(routeOptions, formState.routeId) ?? routeOptions[0]
  const canLoadQuote = Boolean(
    hasBridgeApiConfig &&
      selectedRoute &&
      initialState.destinationAddress.trim() &&
      initialState.amount.trim()
  )

  useEffect(() => {
    setFormState(initialState)
  }, [initialState])

  const quoteQuery = useQuery({
    queryKey: [
      'quote',
      selectedRoute?.routeId ?? '',
      initialState.destinationAddress,
      initialState.amount,
    ],
    queryFn: () => {
      if (!selectedRoute) {
        throw new Error('Unsupported route.')
      }

      return getQuote({
        sourceChain: selectedRoute.sourceChain,
        destinationChain: selectedRoute.destinationChain,
        asset: selectedRoute.asset,
        destinationAddress: initialState.destinationAddress,
        amount: initialState.amount,
      })
    },
    enabled: canLoadQuote,
  })
  const quoteResultItems = quoteQuery.data
    ? [
        {
          label: 'Protocol address',
          value: (
            <CopyableText
              value={quoteQuery.data.protocolAddress}
              label="Copy protocol address"
            />
          ),
        },
        { label: 'Direction', value: humanizeKey(quoteQuery.data.direction) },
        {
          label: 'Source chain',
          value: humanizeKey(quoteQuery.data.sourceChain),
        },
        {
          label: 'Destination chain',
          value: humanizeKey(quoteQuery.data.destinationChain),
        },
        { label: 'Asset', value: quoteQuery.data.asset.toUpperCase() },
        {
          label: 'Source amount',
          value: formatAssetAmountLabel(
            quoteQuery.data.sourceAmount,
            selectedRoute?.sourceAsset
          ),
        },
        {
          label: 'Destination amount',
          value: formatAssetAmountLabel(
            quoteQuery.data.destinationAmount,
            selectedRoute?.destinationAsset
          ),
        },
        {
          label: 'Non-sweep fee amount',
          value: formatAssetAmountLabel(
            quoteQuery.data.destinationFeeAmount,
            selectedRoute?.sourceAsset
          ),
        },
        {
          label: 'Sweep fee amount',
          value: formatAssetAmountLabel(
            quoteQuery.data.sweepFeeAmount,
            selectedRoute?.sourceAsset
          ),
        },
        ...(hasPositiveAmount(quoteQuery.data.payoutFeeAmount)
          ? [
              {
                label: 'Payout fee amount',
                value: formatAssetAmountLabel(
                  quoteQuery.data.payoutFeeAmount,
                  selectedRoute?.sourceAsset
                ),
              },
            ]
          : []),
        ...(hasPositiveAmount(quoteQuery.data.flatFeeAmount)
          ? [
              {
                label: 'Flat fee amount',
                value: formatAssetAmountLabel(
                  quoteQuery.data.flatFeeAmount,
                  selectedRoute?.sourceAsset
                ),
              },
            ]
          : []),
        {
          label: 'Total fee amount',
          value: formatAssetAmountLabel(
            quoteQuery.data.totalFeeAmount,
            selectedRoute?.sourceAsset
          ),
        },
        {
          label: 'Activation required',
          value: quoteQuery.data.activationRequired ? 'Yes' : 'No',
        },
      ]
    : []
  const feeBreakdownItems = quoteQuery.data
    ? [
        ...(hasPositiveAmount(quoteQuery.data.feeDetails.activationFeeUsdc)
          ? [
              {
                label: 'Activation fee (USDC)',
                value: formatAssetAmountLabel(
                  quoteQuery.data.feeDetails.activationFeeUsdc,
                  'usdc'
                ),
              },
            ]
          : []),
        ...(hasPositiveAmount(quoteQuery.data.feeDetails.activationFeeAssetEquivalent)
          ? [
              {
                label: 'Activation fee equivalent',
                value: formatAssetAmountLabel(
                  quoteQuery.data.feeDetails.activationFeeAssetEquivalent,
                  quoteQuery.data.feeDetails.activationFeeAsset
                ),
              },
            ]
          : []),
        ...(hasPositiveAmount(quoteQuery.data.feeDetails.sweepFeeAmount)
          ? [
              {
                label: 'Sweep fee amount',
                value: formatAssetAmountLabel(
                  quoteQuery.data.feeDetails.sweepFeeAmount,
                  selectedRoute?.sourceAsset
                ),
              },
            ]
          : []),
        ...(hasPositiveAmount(quoteQuery.data.feeDetails.payoutFeeAmount)
          ? [
              {
                label: 'Payout fee amount',
                value: formatAssetAmountLabel(
                  quoteQuery.data.feeDetails.payoutFeeAmount,
                  selectedRoute?.sourceAsset
                ),
              },
            ]
          : []),
        ...(hasPositiveAmount(quoteQuery.data.feeDetails.flatFeeAmount)
          ? [
              {
                label: 'Flat fee amount',
                value: formatAssetAmountLabel(
                  quoteQuery.data.feeDetails.flatFeeAmount,
                  selectedRoute?.sourceAsset
                ),
              },
            ]
          : []),
        {
          label: 'Total fee amount',
          value: formatAssetAmountLabel(
            quoteQuery.data.feeDetails.totalFeeAmount,
            selectedRoute?.sourceAsset
          ),
        },
        {
          label: 'Activation fee multiplier bps',
          value: quoteQuery.data.feeDetails.activationFeeMultiplierBps.toString(),
        },
        {
          label: 'Sweep gas multiplier bps',
          value: quoteQuery.data.feeDetails.sweepGasMultiplierBps.toString(),
        },
        {
          label: 'Payout gas multiplier bps',
          value: quoteQuery.data.feeDetails.payoutGasMultiplierBps.toString(),
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Quote explorer"
        breadcrumbItems={[
          { label: 'Overview', to: homePath() },
          { label: 'Quote' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void Promise.all([routesQuery.refetch(), quoteQuery.refetch()])
            }}
            disabled={
              !hasBridgeApiConfig ||
              routesQuery.isFetching ||
              quoteQuery.isFetching ||
              !canLoadQuote
            }
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      <Card className="rounded-lg border border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle>Quote inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()

              if (!formState.destinationAddress.trim() || !formState.amount.trim()) {
                setError('Destination address and amount are required.')
                return
              }

              setError('')
              void navigate(quotePath(quoteSearchParamsFromState(formState)))
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={routeFieldId}>Route</FieldLabel>
                <Select
                  value={formState.routeId}
                  onValueChange={(value) => {
                    if (!value) {
                      return
                    }

                    setFormState((current) => ({
                      ...current,
                      routeId: value,
                    }))
                  }}
                >
                  <SelectTrigger id={routeFieldId} className="w-full">
                    <SelectValue
                      placeholder={routeOptions.length ? 'Select route' : 'No routes available'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {routeOptions.map((option) => (
                        <SelectItem key={option.routeId} value={option.routeId}>
                          {humanizeKey(option.sourceChain)} to{' '}
                          {humanizeKey(option.destinationChain)} ·{' '}
                          {option.asset.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="quote-destination-address">
                  Destination address
                </FieldLabel>
                <Input
                  id="quote-destination-address"
                  value={formState.destinationAddress}
                  aria-invalid={error ? true : undefined}
                  placeholder="0x..."
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      destinationAddress: event.target.value,
                    }))
                  }}
                />
              </Field>

              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="quote-amount">Source amount</FieldLabel>
                <Input
                  id="quote-amount"
                  value={formState.amount}
                  aria-invalid={error ? true : undefined}
                  placeholder="10000000000000000"
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }}
                />
                  <FieldDescription>
                  {formSelectedRoute
                    ? `Base units for ${formSelectedRoute.sourceAsset.toUpperCase()}. Minimum amount: ${formatAssetAmountLabel(formSelectedRoute.minimumAmount, formSelectedRoute.sourceAsset)}.`
                    : 'Load routes from the bridge API to inspect quoteable paths.'}
                </FieldDescription>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </Field>
            </FieldGroup>

            <div className="flex items-center gap-3">
              <Button type="submit">Load quote</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next = defaultQuoteSearchState(routeOptions[0]?.routeId)
                  setFormState(next)
                  setError('')
                  void navigate(quotePath())
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!hasBridgeApiConfig ? <ApiConfigAlert /> : null}

      {routesQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Routes request failed</AlertTitle>
          <AlertDescription>{routesQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {quoteQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Quote request failed</AlertTitle>
          <AlertDescription>{quoteQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {quoteQuery.data ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-lg border border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Quote result</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList items={quoteResultItems} />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="rounded-lg border border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Fee breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailList items={feeBreakdownItems} />
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Pricing window</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Mid {quoteQuery.data.pricing.ethUsdcMid}</Badge>
                  {quoteQuery.data.pricing.bestBid ? (
                    <Badge variant="outline">Bid {quoteQuery.data.pricing.bestBid}</Badge>
                  ) : null}
                  {quoteQuery.data.pricing.bestAsk ? (
                    <Badge variant="outline">Ask {quoteQuery.data.pricing.bestAsk}</Badge>
                  ) : null}
                  <Badge variant="outline">
                    Spread {quoteQuery.data.pricing.spreadBps} bps
                  </Badge>
                </div>
                <DetailList
                  items={[
                    {
                      label: 'Observed at',
                      value: formatTimestamp(quoteQuery.data.pricing.observedAt),
                    },
                    {
                      label: 'Expires at',
                      value: formatTimestamp(quoteQuery.data.pricing.expiresAt),
                    },
                    {
                      label: 'Quote status',
                      value: humanizeKey(quoteQuery.data.status),
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : quoteQuery.isLoading && hasBridgeApiConfig ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : !hasBridgeApiConfig ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-lg border border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Quote result</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingDetailList rows={8} />
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Fee breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingDetailList rows={6} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="rounded-lg border border-border bg-card shadow-none">
          <CardContent className="pt-4">
            <CardEmptyState
              title="No quote loaded"
              description="Submit a route, destination address, and amount."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
