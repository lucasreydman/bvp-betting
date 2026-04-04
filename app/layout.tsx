import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'MLB BvP Betting',
  description:
    'Career batter vs pitcher stats for the Player to Record a Hit prop. Daily Double parlay picks for FanDuel, Bet365, and theScore. Filter by AVG, AB, and OPS.',
  openGraph: {
    title: 'MLB BvP: Daily Hit Prop Picks',
    description:
      "Today's best batter vs pitcher matchups ranked by career batting average. Daily Double parlay picks for FanDuel, Bet365, and theScore.",
    type: 'website',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MLB BvP: Daily Hit Prop Picks',
    description:
      "Today's best batter vs pitcher matchups ranked by career batting average. Daily Double parlay picks.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
