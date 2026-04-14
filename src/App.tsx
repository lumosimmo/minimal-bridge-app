import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { appRoutes } from '@/app/routes'

const router = createBrowserRouter(appRoutes)

function App() {
  return <RouterProvider router={router} />
}

export default App
