import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MLB BvP Betting: Daily Hit Prop Picks'
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

        {/* Icon + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 96,
              height: 96,
              borderRadius: 999,
              background: '#0f172a',
              border: '2px solid #1e3a5f',
              fontSize: 52,
            }}
          >
            ⚾
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 68,
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
          Career BvP stats for the Player Hits prop — min 15 AB, .300 AVG. Recommended Double parlay picks ranked by weighted average.
        </div>

        {/* Sportsbook pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'FanDuel', color: '#1493FF' },
            { label: 'Bet365', color: '#126E51' },
            { label: 'theScore Bet', color: '#FFCC00' },
            { label: 'DraftKings', color: '#61B50E' },
            { label: 'BetMGM', color: '#B1801E' },
            
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
          bvp-betting.vercel.app
        </div>
      </div>
    ),
    { ...size },
  )
}
