'use client'

import { Toaster } from 'sonner'

export function Providers({ children }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" closeButton duration={5000} />
    </>
  )
}
