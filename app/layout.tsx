import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { getSiteUrl, SITE_NAME } from '@/lib/site'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MLB BvP Betting | Batter vs Pitcher Stats for MLB Hit Props',
    template: '%s | MLB BvP Betting',
  },
  description:
    'Daily MLB batter versus pitcher stats for hit props and BvP betting. Track career BVP stats, MLB hit props, and Top 4 batter vs pitcher matchups ranked by batting average weighted by sample size.',
  keywords: [
    'batter versus pitcher stats',
    'batter versus pitcher betting',
    'BVP stats',
    'BVP betting',
    'MLB BVP',
    'MLB BVP betting',
    'MLB hit props',
    'MLB batter vs pitcher stats',
    'baseball hit props',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'sports',
  openGraph: {
    title: 'MLB BvP Betting: Batter vs Pitcher Stats for MLB Hit Props',
    description:
      'Daily MLB batter versus pitcher stats, BvP betting angles, and hit prop picks ranked by career batting average and sample size.',
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    images: [{ url: '/opengraph-image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MLB BvP Betting: Batter vs Pitcher Stats for MLB Hit Props',
    description:
      'Daily MLB batter versus pitcher stats, BvP betting angles, and hit prop picks ranked by career batting average and sample size.',
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
