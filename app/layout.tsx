import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pick Duel - Two Player Decision Maker',
  description: 'A fun two-player web app where users secretly enter options, eliminate them in turn-based sequence, then vote to make a final decision.',
  keywords: 'decision maker, two player, game, voting, elimination',
  authors: [{ name: 'Pick Duel Team' }],
  openGraph: {
    title: 'Pick Duel - Two Player Decision Maker',
    description: 'Make decisions together with this fun elimination and voting game!',
    type: 'website',
    url: 'https://pickduel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pick Duel - Two Player Decision Maker',
    description: 'Make decisions together with this fun elimination and voting game!',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  )
} 