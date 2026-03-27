import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'

import { TooltipProvider } from '@/components/ui/tooltip'

import './globals.css'

/** 支持完整 URL（含图床 https://...）；未设置时沿用站点 Logo */
const faviconUrl =
  process.env.NEXT_PUBLIC_FAVICON?.trim() || process.env.NEXT_PUBLIC_SITE_LOGO?.trim() || ''

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || 'Gatus Frontend',
  description: process.env.NEXT_PUBLIC_SITE_DESC || 'A fully open-source status page with Gatus and Payload',
  ...(faviconUrl ? { icons: faviconUrl } : {}),
  alternates: {
    types: {
      'application/atom+xml': '/history.atom',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // https://github.com/pacocoursey/next-themes#with-app
    <html lang='en' suppressHydrationWarning>
      <body>
        <ThemeProvider attribute='data-theme'>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
