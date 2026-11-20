import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ReduxProvider } from '@/components/providers/ReduxProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { getPublicSiteSettings } from '@/lib/public-data'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  const siteName = settings?.siteName || 'Najid Traders'
  const favicon = settings?.favicon || '/favicon.ico'

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description:
      settings?.seo?.metaDescription ||
      settings?.siteTagline ||
      'Direct Factory Sourcing & Wholesale Partner',
    icons: {
      icon: [
        { url: favicon },
        { url: '/favicon.ico' },
      ],
      shortcut: [favicon],
      apple: [
        { url: favicon, sizes: '180x180', type: 'image/png' },
      ],
    },
  }
}

export default async function RootLayout({ children }) {
  const settings = await getPublicSiteSettings()
  const favicon = settings?.favicon

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {favicon ? (
          <>
            <link rel="icon" href={favicon} sizes="any" />
            <link rel="shortcut icon" href={favicon} />
            <link rel="apple-touch-icon" href={favicon} />
          </>
        ) : null}
      </head>
      <body
        className={`${geist.className} antialiased selection:bg-violet-100 selection:text-violet-900`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ReduxProvider>
            {children}
          </ReduxProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
