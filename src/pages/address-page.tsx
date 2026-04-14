import { useQuery } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import {
  getBindingByProtocolAddress,
  getBindingsByDestinationAddress,
  getBridgeApiBaseUrl,
  getOperations,
} from '@/lib/bridge-api'
import {
  formatAssetAmountLabel,
  formatCount,
  formatHash,
  formatTimestamp,
  humanizeKey,
  inferRouteAssets,
  sumIntegerAmounts,
} from '@/lib/format'
import { homePath, operationDetailPath } from '@/lib/routes'
import {
  ApiConfigAlert,
  CardEmptyState,
  CopyableText,
  LoadingTable,
  OperationStateBadge,
  PageHeader,
} from '@/components/explorer/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AddressPage() {
  const { address = '' } = useParams()
  const bridgeApiBaseUrl = getBridgeApiBaseUrl()
  const hasBridgeApiConfig = Boolean(bridgeApiBaseUrl)

  const operationsQuery = useQuery({
    queryKey: ['operations', address],
    queryFn: () => getOperations(address),
    enabled: Boolean(hasBridgeApiConfig && address),
  })
  const destinationBindingsQuery = useQuery({
    queryKey: ['bindings', 'destination', address],
    queryFn: () => getBindingsByDestinationAddress(address),
    enabled: Boolean(hasBridgeApiConfig && address),
  })
  const protocolBindingQuery = useQuery({
    queryKey: ['bindings', 'protocol', address],
    queryFn: () => getBindingByProtocolAddress(address),
    enabled: Boolean(hasBridgeApiConfig && address),
  })

  const operations = [...(operationsQuery.data?.operations ?? [])].sort(
    (left, right) =>
      new Date(right.opCreatedAt).getTime() - new Date(left.opCreatedAt).getTime()
  )
  const bindings = Array.from(
    new Map(
      [
        ...(destinationBindingsQuery.data?.bindings ?? []),
        ...(protocolBindingQuery.data?.binding ? [protocolBindingQuery.data.binding] : []),
      ].map((binding) => [binding.bindingId, binding])
    ).values()
  )
  const bindingByProtocolAddress = new Map(
    bindings.map((binding) => [binding.protocolAddress, binding] as const)
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Address explorer"
        description={
          <CopyableText
            value={address}
            display={<code>{address}</code>}
            label="Copy address"
            className="max-w-full"
          />
        }
        breadcrumbItems={[
          { label: 'Home', to: homePath() },
          { label: 'Address' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void Promise.all([
                operationsQuery.refetch(),
                destinationBindingsQuery.refetch(),
                protocolBindingQuery.refetch(),
              ])
            }}
            disabled={
              !hasBridgeApiConfig ||
              operationsQuery.isFetching ||
              destinationBindingsQuery.isFetching ||
              protocolBindingQuery.isFetching
            }
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      {!hasBridgeApiConfig ? <ApiConfigAlert /> : null}

      {operationsQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Address request failed</AlertTitle>
          <AlertDescription>{operationsQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {destinationBindingsQuery.error || protocolBindingQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Binding request failed</AlertTitle>
          <AlertDescription>
            {destinationBindingsQuery.error?.message ?? protocolBindingQuery.error?.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-base leading-snug font-medium">Bound protocol addresses</h2>
          {destinationBindingsQuery.isLoading || protocolBindingQuery.isLoading || !hasBridgeApiConfig ? (
            <LoadingTable rows={4} />
          ) : bindings.length ? (
            <ScrollArea className="max-h-44 rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocol address</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Signatures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bindings.map((binding) => (
                    <TableRow key={binding.bindingId}>
                      <TableCell className="font-medium">
                        <CopyableText
                          value={binding.protocolAddress}
                          display={formatHash(binding.protocolAddress)}
                          label="Copy protocol address"
                        />
                      </TableCell>
                      <TableCell>
                        {humanizeKey(binding.sourceChain)} to{' '}
                        {humanizeKey(binding.destinationChain)}
                      </TableCell>
                      <TableCell>
                        {binding.sourceAsset.toUpperCase()} to{' '}
                        {binding.destinationAsset.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {formatAssetAmountLabel(binding.minimumAmount, binding.sourceAsset)}
                      </TableCell>
                      <TableCell>
                        <CopyableText
                          value={binding.destinationAddress}
                          display={formatHash(binding.destinationAddress)}
                          label="Copy destination address"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatCount(Object.keys(binding.signatures).length)} signatures
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <CardEmptyState
              title="No bindings found"
              description="No bindings."
            />
          )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base leading-snug font-medium">Operation history</h2>
          {operationsQuery.isLoading || !hasBridgeApiConfig ? (
            <LoadingTable rows={6} />
          ) : operations.length ? (
            <ScrollArea className="h-[32rem] rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Amounts</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((operation) => {
                    const binding = bindingByProtocolAddress.get(operation.protocolAddress)
                    const assets = binding
                      ? {
                          sourceAsset: binding.sourceAsset,
                          destinationAsset: binding.destinationAsset,
                        }
                        : inferRouteAssets(
                            operation.sourceChain,
                            operation.destinationChain,
                            operation.asset
                          )
                    const totalFeeAmount = sumIntegerAmounts(
                      operation.destinationFeeAmount,
                      operation.sweepFeeAmount
                    ).toString()

                    return (
                    <TableRow key={operation.operationId}>
                      <TableCell>{formatTimestamp(operation.opCreatedAt)}</TableCell>
                      <TableCell className="max-w-52">
                        <div className="flex flex-col gap-1">
                          <Link
                            to={operationDetailPath(operation.operationId)}
                            className="truncate font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {operation.operationId}
                          </Link>
                          <span className="truncate text-muted-foreground">
                            <CopyableText
                              value={operation.protocolAddress}
                              display={formatHash(operation.protocolAddress)}
                              label="Copy protocol address"
                            />
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {humanizeKey(operation.sourceChain)} to{' '}
                            {humanizeKey(operation.destinationChain)}
                          </span>
                          <span className="text-muted-foreground">
                            {operation.asset.toUpperCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {formatAssetAmountLabel(operation.sourceAmount, assets.sourceAsset)} source
                          </span>
                          <span className="text-muted-foreground">
                            {formatAssetAmountLabel(
                              operation.destinationAmount,
                              assets.destinationAsset
                            )}{' '}
                            destination
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatAssetAmountLabel(totalFeeAmount, assets.sourceAsset)}
                      </TableCell>
                      <TableCell>
                        <OperationStateBadge state={operation.state} />
                      </TableCell>
                      <TableCell className="max-w-52">
                        <div className="flex flex-col gap-1">
                          <span className="truncate">
                            Source{' '}
                            {operation.sourceTxHash ? (
                              <CopyableText
                                value={operation.sourceTxHash}
                                display={formatHash(operation.sourceTxHash)}
                                label="Copy source transaction hash"
                              />
                            ) : (
                              formatHash(operation.sourceTxHash)
                            )}
                          </span>
                          <span className="truncate text-muted-foreground">
                            Destination{' '}
                            {operation.destinationTxHash ? (
                              <CopyableText
                                value={operation.destinationTxHash}
                                display={formatHash(operation.destinationTxHash)}
                                label="Copy destination transaction hash"
                              />
                            ) : (
                              formatHash(operation.destinationTxHash)
                            )}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <CardEmptyState
              title="No operations found"
              description="No operations."
            />
          )}
      </section>
    </div>
  )
}
