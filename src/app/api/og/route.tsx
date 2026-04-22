import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

const size = {
  width: 1200,
  height: 630,
}

const content = {
  corporate: {
    eyebrow: 'Star Kitchen Hospitality Group',
    title: 'Global Flavors. Local Hearts.',
    description: 'AI-enabled hospitality services, dining operations, and supply discipline for modern service environments.',
    accent: '#1a97da',
    background: 'linear-gradient(135deg, #f6efe5 0%, #f2e4cf 42%, #efe7d9 100%)',
    surface: '#102949',
    text: '#171c19',
    pillText: '#102949',
    pills: ['Dining services', 'Central kitchen', 'Supply discipline', 'AI-enabled execution'],
  },
  'ai-tech': {
    eyebrow: 'StarKitchen AI',
    title: 'AI Operating System for Service Chains',
    description: 'Agents, workflows, operational signals, and governed execution for restaurant and hospitality networks.',
    accent: '#ffd400',
    background: 'linear-gradient(135deg, #07101d 0%, #0b1730 48%, #102949 100%)',
    surface: 'rgba(255,255,255,0.08)',
    text: '#f8fbff',
    pillText: '#f8fbff',
    pills: ['AI agents', 'Workflow orchestration', 'Operational signals', 'Governed automation'],
  },
} as const

export async function GET(request: NextRequest) {
  const variant = request.nextUrl.searchParams.get('variant') === 'ai-tech' ? 'ai-tech' : 'corporate'
  const current = content[variant]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: current.background,
          color: current.text,
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 12% 14%, rgba(234,0,22,0.18), transparent 18%), radial-gradient(circle at 85% 18%, rgba(246,138,0,0.16), transparent 18%), radial-gradient(circle at 80% 78%, rgba(26,151,218,0.18), transparent 20%), radial-gradient(circle at 20% 84%, rgba(56,181,51,0.16), transparent 20%), radial-gradient(circle at 55% 22%, rgba(255,212,0,0.16), transparent 18%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            width: '100%',
            height: '100%',
            padding: '52px 56px',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '62%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 28,
                  background: current.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 24px 72px rgba(10, 16, 29, 0.16)',
                  border: variant === 'ai-tech' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(16,41,73,0.08)',
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 18,
                    background:
                      'linear-gradient(135deg, #ea0016 0%, #f68a00 25%, #ffd400 48%, #38b533 72%, #1a97da 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                  }}
                >
                  SK
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 18, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.66 }}>
                  {current.eyebrow}
                </div>
                <div style={{ fontSize: 16, opacity: 0.78 }}>
                  {variant === 'ai-tech' ? 'Service-chain technology website' : 'Corporate hospitality website'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div
                style={{
                  fontSize: 68,
                  lineHeight: 1.02,
                  letterSpacing: '-0.06em',
                  fontWeight: 700,
                  maxWidth: 700,
                }}
              >
                {current.title}
              </div>
              <div style={{ fontSize: 28, lineHeight: 1.3, maxWidth: 720, opacity: 0.82 }}>
                {current.description}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {current.pills.map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderRadius: 999,
                    fontSize: 20,
                    background: variant === 'ai-tech' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.68)',
                    color: current.pillText,
                    border: variant === 'ai-tech' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(16,41,73,0.08)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: '30%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                alignSelf: 'flex-end',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                width: '100%',
              }}
            >
              {[
                { label: 'Red', color: '#ea0016' },
                { label: 'Orange', color: '#f68a00' },
                { label: 'Yellow', color: '#ffd400' },
                { label: 'Green', color: '#38b533' },
                { label: 'Blue', color: '#1a97da' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    borderRadius: 22,
                    background: variant === 'ai-tech' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                    border: variant === 'ai-tech' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(16,41,73,0.08)',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      background: item.color,
                    }}
                  />
                  <div style={{ fontSize: 20, opacity: 0.74 }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-end',
                padding: '18px 22px',
                borderRadius: 24,
                background: current.accent,
                color: variant === 'ai-tech' ? '#07101d' : '#ffffff',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {variant === 'ai-tech' ? 'StarKitchen AI' : 'SK Group'}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
