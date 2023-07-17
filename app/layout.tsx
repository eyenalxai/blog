import './globals.css'
import { fontMono, fontSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          fontSans.variable,
          fontMono.variable
        )}
      >
        <Providers attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className={cn('container', 'mx-auto', 'max-w-2xl')}>
            {children}
          </main>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
