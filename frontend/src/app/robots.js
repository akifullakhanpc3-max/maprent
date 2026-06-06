export default function robots() {
  const baseUrl = 'https://maprent-2.onrender.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/user/',
        '/owner/',
        '/api/',
        '/*?id=*', // Prevent crawling duplicate map overlays
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
