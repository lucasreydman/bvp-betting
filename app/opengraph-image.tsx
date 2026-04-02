import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MLB BvP — Daily Hit Prop Picks'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
            height: '6px',
            background: 'linear-gradient(90deg, #0ea5e9, #22c55e)',
          }}
        />

        {/* Label */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#6b7280',
            marginBottom: 24,
            display: 'flex',
          }}
        >
          MLB Batter vs Pitcher
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.05,
            marginBottom: 32,
            display: 'flex',
          }}
        >
          MLB BvP
        </div>

        {/* Subheading */}
        <div
          style={{
            fontSize: 30,
            color: '#9ca3af',
            maxWidth: 700,
            lineHeight: 1.5,
            marginBottom: 56,
            display: 'flex',
          }}
        >
          Career batting average matchups for today&apos;s slate. Daily Double parlay picks ranked by sample-weighted AVG.
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 20 }}>
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
                fontSize: 22,
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
            fontSize: 22,
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
