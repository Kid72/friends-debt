export default function handler(req, res) {
  const query = req.query || {};
  let room = query.room || '';

  // Handle URL string parsing if room query wasn't parsed automatically
  if (!room && req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      room = url.searchParams.get('room') || '';
    } catch {
      // ignore
    }
  }

  const startUrl = room ? `/?room=${encodeURIComponent(room)}` : '/';

  const manifest = {
    name: 'Dostlar Xərcləri & Borclar',
    short_name: 'DostBorc',
    description: 'Dostlar üçün xərc və borc hesablama PWA',
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4FAF8',
    theme_color: '#006A60',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };

  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
  res.status(200).json(manifest);
}
