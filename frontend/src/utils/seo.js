/**
 * Occupra Premium SEO Metadata Helper
 * Generates production-ready, standardized Next.js Metadata objects.
 */
export function generatePlatformMetadata({
  title,
  description,
  path = '',
  image = '/logo/Occupra logo.png',
  type = 'website',
  publishDate,
  author = 'Occupra Editorial',
  tags = []
}) {
  const baseUrl = 'https://maprent-2.onrender.com';
  const canonicalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  
  // Format the image absolute URL
  const absoluteImageUrl = image.startsWith('http') 
    ? image 
    : `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`;

  // Premium title branding suffix
  const pageTitle = title.includes('Occupra') ? title : `${title} | Occupra`;

  const metadata = {
    title: pageTitle,
    description: description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: description,
      url: canonicalUrl,
      siteName: 'Occupra Premium Rental Discovery',
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_IN',
      type: type,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: description,
      images: [absoluteImageUrl],
      creator: '@OccupraPlatform',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  // Add rich article specific fields if required
  if (type === 'article') {
    metadata.openGraph.article = {
      publishedTime: publishDate,
      authors: [author],
      tags: tags,
    };
  }

  return metadata;
}

/**
 * Generate Breadcrumb JSON-LD Structured Data Schema Markup
 */
export function generateBreadcrumbSchema(items) {
  const baseUrl = 'https://maprent-2.onrender.com';
  
  const schemaList = items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url.startsWith('http') ? item.url : `${baseUrl}${item.url.startsWith('/') ? item.url : `/${item.url}`}`
  }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": schemaList
  };
}
