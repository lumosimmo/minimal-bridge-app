import { Navigate, Outlet, type RouteObject } from 'react-router-dom'

import { AppShell } from '@/components/explorer/app-shell'
import { AddressPage } from '@/pages/address-page'
import { OperationPage } from '@/pages/operation-page'
import { OverviewPage } from '@/pages/overview-page'
import { QuotePage } from '@/pages/quote-page'

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: 'addresses/:address',
        element: <AddressPage />,
      },
      {
        path: 'operations/:operationId',
        element: <OperationPage />,
      },
      {
        path: 'addresses/:address/operations/:operationId',
        element: <OperationPage />,
      },
      {
        path: 'quote',
        element: <QuotePage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]
