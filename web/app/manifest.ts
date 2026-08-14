import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FantomWorks Call Log',
    short_name: 'Call Log',
    description: 'FantomWorks project submission call log',
    start_url: '/calls',
    display: 'standalone',
    background_color: '#17191c',
    theme_color: '#c1352b',
    icons: [
      {
        src: '/logo.png',
        sizes: '434x434',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
