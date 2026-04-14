import type { ReactNode } from 'react'
import { BoxIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { homePath } from '@/lib/routes'
import { BridgeSearchForm } from '@/components/explorer/bridge-search-form'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
      <Card className="rounded-lg border border-border bg-background shadow-none">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <Link
                to={homePath()}
                className="flex w-fit items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BoxIcon className="text-chart-1" />
                <CardTitle className="text-base font-semibold">
                  Minimal Bridge Explorer
                </CardTitle>
              </Link>
            </div>
            <div className="w-full max-w-3xl">
              <BridgeSearchForm compact />
            </div>
          </div>
        </CardHeader>
      </Card>
      {children}
    </main>
  )
}
