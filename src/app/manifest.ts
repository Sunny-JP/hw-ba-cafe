import { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Café Timer',
    short_name: 'Café Timer',
    description: 'A timer app for BA cafe',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}