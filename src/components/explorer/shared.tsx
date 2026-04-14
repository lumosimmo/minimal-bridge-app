import { useState, type ReactNode } from 'react'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CopyIcon,
  PlugZapIcon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { humanizeState, formatTimestamp } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbItems,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  breadcrumbItems?: Array<{ label: string; to?: string }>
}) {
  return (
    <div className="flex flex-col gap-3">
      {breadcrumbItems?.length ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <div key={`${item.label}:${item.to ?? index}`} className="contents">
                <BreadcrumbItem>
                  {item.to ? (
                    <BreadcrumbLink render={<Link to={item.to} />}>
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 ? (
                  <BreadcrumbSeparator />
                ) : null}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs">{description}</CardDescription>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

export function MetricCard({
  title,
  value,
  detail,
  footer,
  to,
}: {
  title: string
  value: string
  detail?: string
  footer?: ReactNode
  to?: string
}) {
  const card = (
    <Card
      size="sm"
      className={cn(
        'min-h-24 rounded-lg border border-border bg-card shadow-none',
        to
          ? 'transition-colors hover:border-muted-foreground/40 hover:bg-muted/30'
          : ''
      )}
    >
      <CardHeader className="gap-2">
        <CardDescription className="text-[11px] uppercase tracking-[0.14em]">
          {title}
        </CardDescription>
        {detail ? <CardDescription className="text-[11px]">{detail}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <span className="font-mono text-2xl font-medium tracking-tight">{value}</span>
        {footer}
      </CardContent>
    </Card>
  )

  if (!to) {
    return card
  }

  return (
    <Link
      to={to}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  )
}

export function LoadingCard() {
  return (
    <Card className="rounded-lg border border-border bg-card shadow-none">
      <CardHeader className="gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export function LoadingTable({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <Card size="sm" className="min-h-24 rounded-lg border border-border bg-card shadow-none">
      <CardHeader className="gap-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="size-6 rounded-full" />
      </CardContent>
    </Card>
  )
}

export function LoadingDetailList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          {index ? <Separator /> : null}
          <div className="flex items-start justify-between gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ApiConfigAlert() {
  return (
    <Alert className="rounded-lg border-border bg-card">
      <PlugZapIcon />
      <AlertTitle>Connect the bridge API</AlertTitle>
      <AlertDescription>
        Set <code>VITE_MINIMAL_BRIDGE_API_URL</code> and restart Vite.
      </AlertDescription>
    </Alert>
  )
}

export function CardEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty className="rounded-lg border border-dashed border-border bg-muted/15">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function StateBadge({ healthy }: { healthy: boolean }) {
  return (
    <Badge variant={healthy ? 'secondary' : 'destructive'}>
      {healthy ? <CheckCircle2Icon /> : <AlertCircleIcon />}
      {healthy ? 'Healthy' : 'Unhealthy'}
    </Badge>
  )
}

export function OperationStateBadge({ state }: { state: string }) {
  const normalized = state.toLowerCase()

  if (
    normalized.includes('complete') ||
    normalized.includes('confirmed') ||
    normalized.includes('ready')
  ) {
    return (
      <Badge variant="secondary">
        <CheckCircle2Icon />
        {humanizeState(state)}
      </Badge>
    )
  }

  if (
    normalized.includes('error') ||
    normalized.includes('fail') ||
    normalized.includes('stuck') ||
    normalized.includes('blocked') ||
    normalized.includes('stale')
  ) {
    return (
      <Badge variant="destructive">
        <AlertCircleIcon />
        {humanizeState(state)}
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <RefreshCwIcon />
      {humanizeState(state)}
    </Badge>
  )
}

export function DetailList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-col gap-3">
          {index ? <Separator /> : null}
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="max-w-[60%] text-right font-medium break-all">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LatestTimestamp({ value }: { value?: string }) {
  return <>{value ? formatTimestamp(value) : 'Unavailable'}</>
}

export function CopyValueButton({
  value,
  label = 'Copy value',
}: {
  value: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="size-4 shrink-0 rounded-sm p-0 align-middle text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          window.setTimeout(() => {
            setCopied(false)
          }, 1200)
        })
      }}
    >
      {copied ? <CheckCircle2Icon /> : <CopyIcon />}
    </Button>
  )
}

export function CopyableText({
  value,
  display,
  label,
  className,
}: {
  value: string
  display?: ReactNode
  label?: string
  className?: string
}) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1 leading-none align-middle', className)}>
      <span className="truncate">{display ?? value}</span>
      <CopyValueButton value={value} label={label} />
    </span>
  )
}
