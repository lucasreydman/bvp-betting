import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MLB BvP',
  description:
    'MLB batter vs pitcher stats for the batter to get a hit prop. Filter and sort by OPS, AVG, SLG, and AB.',
  icons: [{ rel: 'icon', url: '/vercel.svg' }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
