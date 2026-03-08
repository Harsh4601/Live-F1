import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Audiowide } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const audiowide = Audiowide({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-audiowide',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Live F1 Dashboard',
  description: 'Real-time Formula 1 racing dashboard powered by OpenF1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} ${audiowide.variable}`}>
      <body suppressHydrationWarning className="bg-f1-dark text-white antialiased min-h-screen font-sans">
        <div className="h-1 bg-gradient-to-r from-f1-red via-red-500 to-f1-red" />
        {children}
      </body>
    </html>
  )
}
