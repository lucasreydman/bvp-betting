import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'MLB BvP Betting',
  description:
    'Career batter vs pitcher stats for the Player to Record a Hit prop, with consensus odds from major US books. Ranked by BvP batting average weighted by sample size. Daily Double, Secondary Double, and Smash Double pairings updated daily.',
  openGraph: {
    title: 'MLB BvP Betting: Daily Hit Prop Picks',
    description:
      "Today's best batter vs pitcher matchups ranked by career batting average. Daily Double, Secondary Double, and Smash Double pairings for all major sportsbooks.",
    type: 'website',
    url: SITE_URL,
    images: [{ url: '/opengraph-image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MLB BvP Betting: Daily Hit Prop Picks',
    description:
      "Today's best batter vs pitcher matchups ranked by career batting average. Daily Double, Secondary Double, and Smash Double pairings.",
    images: ['/opengraph-image'],
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
