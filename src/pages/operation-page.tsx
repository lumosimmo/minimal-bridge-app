import { useQuery } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { getBridgeApiBaseUrl, getOperationById, getOperations } from '@/lib/bridge-api'
import {
  formatAssetAmountLabel,
  formatCount,
  formatTimestamp,
  hasPositiveAmount,
  humanizeKey,
} from '@/lib/format'
import { addressPath, homePath, operationDetailPath } from '@/lib/routes'
import {
  ApiConfigAlert,
  CardEmptyState,
  CopyableText,
  DetailList,
  LoadingCard,
  LoadingDetailList,
  PageHeader,
} from '@/components/explorer/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function OperationPage() {
  const navigate = useNavigate()
  const { address = '', operationId = '' } = useParams()
  const bridgeApiBaseUrl = getBridgeApiBaseUrl()
  const hasBridgeApiConfig = Boolean(bridgeApiBaseUrl)

  const operationDetailQuery = useQuery({
    queryKey: ['operation', operationId],
    queryFn: () => getOperationById(operationId),
    enabled: Boolean(hasBridgeApiConfig && operationId),
  })

  const operation = operationDetailQuery.data?.operation
  const binding = operationDetailQuery.data?.binding
  const withdrawalQueue = operationDetailQuery.data?.withdrawalQueue
  const relatedAddress = binding?.protocolAddress ?? binding?.destinationAddress ?? address

  const operationsQuery = useQuery({
    queryKey: ['operations', relatedAddress],
    queryFn: () => getOperations(relatedAddress),
    enabled: Boolean(hasBridgeApiConfig && relatedAddress),
  })

  const operations = [...(operationsQuery.data?.operations ?? [])].sort(
    (left, right) =>
      new Date(right.opCreatedAt).getTime() - new Date(left.opCreatedAt).getTime()
  )
  const operationIndex = operations.findIndex((item) => item.operationId === operationId)
  const previousOperation = operationIndex >= 0 ? operations[operationIndex + 1] : undefined
  const nextOperation = operationIndex > 0 ? operations[operationIndex - 1] : undefined
  const routeAssets = binding
    ? {
        sourceAsset: binding.sourceAsset,
        destinationAsset: binding.destinationAsset,
      }
    : undefined
  const operationFields = operation
    ? [
        { label: 'Operation id', value: operation.operationId },
        { label: 'Route id', value: binding?.routeId ?? 'Unavailable' },
        {
          label: 'Direction',
          value: binding ? humanizeKey(binding.direction) : 'Unavailable',
        },
        {
          label: 'Route',
          value: `${humanizeKey(operation.sourceChain)} to ${humanizeKey(operation.destinationChain)}`,
        },
        { label: 'Asset', value: operation.asset.toUpperCase() },
        {
          label: 'Source address',
          value: (
            <CopyableText
              value={operation.sourceAddress}
              label="Copy source address"
            />
          ),
        },
        {
          label: 'Destination address',
          value: (
            <CopyableText
              value={operation.destinationAddress}
              label="Copy destination address"
            />
          ),
        },
        {
          label: 'Protocol address',
          value: (
            <CopyableText
              value={operation.protocolAddress}
              label="Copy protocol address"
            />
          ),
        },
        {
          label: 'Source amount',
          value: formatAssetAmountLabel(
            operation.sourceAmount,
            routeAssets?.sourceAsset
          ),
        },
        {
          label: 'Destination amount',
          value: formatAssetAmountLabel(
            operation.destinationAmount,
            routeAssets?.destinationAsset
          ),
        },
        {
          label: 'Non-sweep fee amount',
          value: formatAssetAmountLabel(
            operation.destinationFeeAmount,
            routeAssets?.sourceAsset
          ),
        },
        {
          label: 'Sweep fee amount',
          value: formatAssetAmountLabel(
            operation.sweepFeeAmount,
            routeAssets?.sourceAsset
          ),
        },
        ...(hasPositiveAmount(operation.feeDetails?.activationFeeUsdc)
          ? [
              {
                label: 'Activation fee (USDC)',
                value: formatAssetAmountLabel(operation.feeDetails?.activationFeeUsdc, 'usdc'),
              },
            ]
          : []),
        ...(hasPositiveAmount(operation.feeDetails?.activationFeeAssetEquivalent)
          ? [
              {
                label: 'Activation fee equivalent',
                value: formatAssetAmountLabel(
                  operation.feeDetails?.activationFeeAssetEquivalent,
                  routeAssets?.sourceAsset
                ),
              },
            ]
          : []),
        ...(operation.feeDetails?.feeMultiplierBps
          ? [
              {
                label: 'Activation multiplier bps',
                value: operation.feeDetails.feeMultiplierBps.toString(),
              },
            ]
          : []),
        {
          label: 'Source tx hash',
          value: operation.sourceTxHash ? (
            <CopyableText
              value={operation.sourceTxHash}
              label="Copy source transaction hash"
            />
          ) : (
            'Unavailable'
          ),
        },
        {
          label: 'Destination tx hash',
          value: operation.destinationTxHash ? (
            <CopyableText
              value={operation.destinationTxHash}
              label="Copy destination transaction hash"
            />
          ) : (
            'Unavailable'
          ),
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Operation detail"
        description={
          binding ? (
            <CopyableText
              value={binding.protocolAddress}
              display={<code>{binding.protocolAddress}</code>}
              label="Copy protocol address"
              className="max-w-full"
            />
          ) : (
            <code>{operationId}</code>
          )
        }
        breadcrumbItems={[
          { label: 'Home', to: homePath() },
          ...(binding ? [{ label: 'Address', to: addressPath(binding.protocolAddress) }] : []),
          { label: 'Operation' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void Promise.all([operationDetailQuery.refetch(), operationsQuery.refetch()])
            }}
            disabled={
              !hasBridgeApiConfig ||
              operationDetailQuery.isFetching ||
              operationsQuery.isFetching
            }
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      {!hasBridgeApiConfig ? <ApiConfigAlert /> : null}

      {operationDetailQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Operation request failed</AlertTitle>
          <AlertDescription>{operationDetailQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {operationsQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Related operations request failed</AlertTitle>
          <AlertDescription>{operationsQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {operationDetailQuery.isLoading || !hasBridgeApiConfig ? <LoadingCard /> : null}

      {!operationDetailQuery.isLoading && hasBridgeApiConfig && !operation ? (
        <Card className="rounded-lg border border-border bg-card shadow-none">
          <CardContent className="pt-4">
            <CardEmptyState
              title="Operation not found"
              description="No match."
            />
          </CardContent>
        </Card>
      ) : null}

      {operation ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-lg border border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Operation fields</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailList items={operationFields} />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="rounded-lg border border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Binding context</CardTitle>
                </CardHeader>
                <CardContent>
                  {binding ? (
                    <DetailList
                      items={[
                        { label: 'Binding id', value: binding.bindingId },
                        {
                          label: 'Protocol address',
                          value: (
                            <CopyableText
                              value={binding.protocolAddress}
                              label="Copy protocol address"
                            />
                          ),
                        },
                        { label: 'Route id', value: binding.routeId },
                        {
                          label: 'Route',
                          value: `${humanizeKey(binding.sourceChain)} to ${humanizeKey(binding.destinationChain)}`,
                        },
                        {
                          label: 'Assets',
                          value: `${binding.sourceAsset.toUpperCase()} to ${binding.destinationAsset.toUpperCase()}`,
                        },
                        {
                          label: 'Minimum amount',
                          value: formatAssetAmountLabel(binding.minimumAmount, binding.sourceAsset),
                        },
                        {
                          label: 'Destination address',
                          value: (
                            <CopyableText
                              value={binding.destinationAddress}
                              label="Copy destination address"
                            />
                          ),
                        },
                        {
                          label: 'Signatures',
                          value: formatCount(Object.keys(binding.signatures).length),
                        },
                      ]}
                    />
                  ) : (
                    <CardEmptyState
                      title="Binding context unavailable"
                      description="No binding."
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Withdrawal queue</CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawalQueue ? (
                    <DetailList
                      items={[
                        { label: 'Phase', value: humanizeKey(withdrawalQueue.phase) },
                        {
                          label: 'Operation state',
                          value: humanizeKey(withdrawalQueue.operationState),
                        },
                        {
                          label: 'Queue updated',
                          value: formatTimestamp(withdrawalQueue.updatedAt),
                        },
                        {
                          label: 'Sweep state',
                          value: humanizeKey(withdrawalQueue.sweep?.state ?? 'unavailable'),
                        },
                        {
                          label: 'Sweep tx hash',
                          value: withdrawalQueue.sweep?.txHash ? (
                            <CopyableText
                              value={withdrawalQueue.sweep.txHash}
                              label="Copy sweep transaction hash"
                            />
                          ) : (
                            'Unavailable'
                          ),
                        },
                        {
                          label: 'Payout state',
                          value: humanizeKey(withdrawalQueue.payout?.state ?? 'unavailable'),
                        },
                        {
                          label: 'Payout tx hash',
                          value: withdrawalQueue.payout?.txHash ? (
                            <CopyableText
                              value={withdrawalQueue.payout.txHash}
                              label="Copy payout transaction hash"
                            />
                          ) : (
                            'Unavailable'
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <CardEmptyState
                      title="No queue item"
                      description="This operation is not currently represented in the withdrawal queue."
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Adjacent operations</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    disabled={!nextOperation}
                    onClick={() => {
                      if (!nextOperation) {
                        return
                      }

                      void navigate(operationDetailPath(nextOperation.operationId))
                    }}
                  >
                    Next newer operation
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!previousOperation}
                    onClick={() => {
                      if (!previousOperation) {
                        return
                      }

                      void navigate(operationDetailPath(previousOperation.operationId))
                    }}
                  >
                    Previous older operation
                  </Button>
                  <Button
                    onClick={() => {
                      if (!relatedAddress) {
                        return
                      }

                      void navigate(addressPath(relatedAddress))
                    }}
                    disabled={!relatedAddress}
                  >
                    Back to address
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : !hasBridgeApiConfig ? (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-lg border border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Operation fields</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingDetailList rows={10} />
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            <Card className="rounded-lg border border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Binding context</CardTitle>
              </CardHeader>
              <CardContent>
                <LoadingDetailList rows={5} />
              </CardContent>
            </Card>
            <Card className="rounded-lg border border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Adjacent operations</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button disabled>Next newer operation</Button>
                <Button disabled>Previous older operation</Button>
                <Button disabled>Back to address</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
