import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ReduxProvider } from '@/components/providers/ReduxProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata = {
  title: 'Dynamic CMS',
  description: 'Modular Dynamic CMS Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
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
