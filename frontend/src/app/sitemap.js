export default async function sitemap() {
  const baseUrl = 'https://maprent-2.onrender.com';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://maprent-2.onrender.com/api';

  // 1. Core Static Pages
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Dynamic Property Listings URLs
  let propertyUrls = [];
  try {
    const res = await fetch(`${apiUrl}/properties`, { 
      next: { revalidate: 3600 } // Cache sitemap properties for 1 hour
    });
    if (res.ok) {
      const properties = await res.json();
      if (Array.isArray(properties)) {
        propertyUrls = properties
          .filter(p => p.status === 'approved') // Only index approved properties
          .map((property) => ({
            url: `${baseUrl}/property/${property._id}`,
            lastModified: new Date(property.updatedAt || property.createdAt || new Date()),
            changeFrequency: 'weekly',
            priority: 0.7,
          }));
      }
    }
  } catch (err) {
    console.error("[SITEMAP_PROPERTIES_FETCH_ERROR]", err);
  }

  // 3. Dynamic Blog Post URLs (Temporarily Disabled)
  let blogUrls = [];

  return [...staticUrls, ...propertyUrls];
}
