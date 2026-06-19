import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from './components/AppLayout'
import { GalleryIndex } from './routes/GalleryIndex'
import { PrototypeScreen } from './routes/PrototypeScreen'
import { PrototypeCanvas } from './routes/PrototypeCanvas'
import { NotFound } from './routes/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <GalleryIndex /> },
      { path: 'p/:prototypeId', element: <PrototypeScreen /> },
      { path: 'p/:prototypeId/canvas', element: <PrototypeCanvas /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
