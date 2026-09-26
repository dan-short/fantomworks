import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'FantomWorks Project Submission Form'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#17191c',
          padding: '0 88px',
          fontFamily: 'Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 96,
            height: 6,
            background: '#c1352b',
            marginBottom: 40,
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#ffffff',
            lineHeight: 1,
          }}
        >
          FANTOMWORKS
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: '#c1352b',
            marginTop: 24,
            lineHeight: 1.15,
          }}
        >
          Project Submission Form
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: '#9aa3ad',
            marginTop: 32,
            lineHeight: 1.4,
          }}
        >
          Tell us about your classic car project — Dan Short reviews every submission.
        </div>
      </div>
    ),
    size,
  )
}
