import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MLB BvP Betting: Daily Hit Prop Picks'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Load icon as base64 data URL for use in edge runtime
  let iconSrc: string | null = null
  try {
    const res = await fetch(`${baseUrl}/icon.png`)
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), '')
    iconSrc = `data:image/png;base64,${btoa(binary)}`
  } catch {
    // Render without icon if fetch fails
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#030712',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(90deg, #0ea5e9, #22c55e)',
          }}
        />

        {/* Icon + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 28 }}>
          {iconSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              width={96}
              height={96}
              alt="MLB BvP Betting"
              style={{ borderRadius: 999 }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              MLB BvP Betting
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#4b5563',
                display: 'flex',
              }}
            >
              MLB Batter vs Pitcher
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 28,
            color: '#9ca3af',
            maxWidth: 820,
            lineHeight: 1.5,
            marginBottom: 52,
            display: 'flex',
          }}
        >
          Career BvP stats for the Player Hits prop — min 15 AB, .300 AVG. Daily Double parlay picks ranked by sample-weighted average.
        </div>

        {/* Sportsbook pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'FanDuel', color: '#0ea5e9' },
            { label: 'Bet365', color: '#22c55e' },
            { label: 'theScore Bet', color: '#f59e0b' },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 24px',
                borderRadius: 999,
                border: `2px solid ${color}40`,
                background: `${color}15`,
                fontSize: 20,
                fontWeight: 600,
                color,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom right domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 80,
            fontSize: 20,
            color: '#374151',
            display: 'flex',
          }}
        >
          mlbbvp.vercel.app
        </div>
      </div>
    ),
    { ...size },
  )
}
