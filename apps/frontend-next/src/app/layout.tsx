import './globals.css'
import React from 'react'
import type { Metadata, Viewport } from 'next'
import BackButton from './back-button'

export const metadata: Metadata = {
  title: 'School SAS — Sign In',
  description: 'Modern classic sign-in for Students, Parents, Admin/HOD, Accountant'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <BackButton />
        <div className="container">{children}</div>
      </body>
    </html>
  )
}
