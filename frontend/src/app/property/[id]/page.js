import Link from "next/link";
import { Info } from "lucide-react";
import PropertyDetailsClient from "@/components/DynamicPropertyDetailsClient";


// Helper function to fetch single property details directly on the server
async function getProperty(id) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://maprent-2.onrender.com/api';
  try {
    const res = await fetch(`${apiUrl}/properties/${id}`, { 
      next: { revalidate: 60 } // Cache data for 60 seconds (high performance)
    });
    if (!res.ok) return null;
    return await res.ok ? res.json() : null;
  } catch (err) {
    console.error("[SERVER_FETCH_ERROR]", err);
    return null;
  }
}

// ─── Dynamic SEO Metadata Generation ──────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return {
      title: "Listing Not Found | Occupra Premium Discovery",
      description: "The requested listing could not be found or has been taken down.",
    };
  }

  const priceText = property.price ? `₹${property.price.toLocaleString()}/month` : "Price on Request";
  const seoTitle = `${property.bhkType ? property.bhkType.toUpperCase() + ' ' : ''}${property.title} for Rent in ${property.city || ''} | ${priceText} - Occupra`;
  const seoDesc = property.description 
    ? property.description.substring(0, 160) + '...'
    : `Rent this verified ${property.bhkType || ''} property in ${property.city || ''} for ${priceText}. Direct owner contact, zero commission, map-based discovery.`;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'https://maprent-2.onrender.com';
  const imageUrl = property.images?.[0]?.startsWith('http') ? property.images[0] : `${baseUrl}${property.images?.[0] || '/logo/Occupra logo.png'}`;

  return {
    title: seoTitle,
    description: seoDesc,
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: property.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc,
      images: [imageUrl],
    },
  };
}

export default async function PropertyPage({ params }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
          <Info size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tighter">Listing Not Found</h2>
        <p className="text-slate-500 text-sm max-w-xs mt-2">
          The property listing you are trying to view does not exist or has been deactivated by the owner.
        </p>
        <Link href="/" className="btn btn-primary mt-6 !px-10">
          Back to Discovery Map
        </Link>
      </div>
    );
  }

  // ─── JSON-LD Structured Schema Markup (Google Search Rich Snippet) ──────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SingleFamilyResidence",
    "name": property.title,
    "description": property.description || `Verified rental home in ${property.city}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.city,
      "addressRegion": "Karnataka",
      "addressCountry": "IN"
    },
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "INR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": property.price,
        "priceCurrency": "INR",
        "referenceQuantity": {
          "@type": "QuantitativeValue",
          "value": 1,
          "unitCode": "MON"
        }
      },
      "availability": "https://schema.org/InStock",
      "url": `https://maprent-2.onrender.com/property/${property._id}`
    }
  };

  return (
    <>
      {/* Inject Structured Data into the HTML Head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <PropertyDetailsClient property={property} />
    </>
  );
}
