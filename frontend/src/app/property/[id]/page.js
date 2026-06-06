import Link from "next/link";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";


// Helper function to fetch single property details directly on the server
async function getProperty(id) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://maprent-2.onrender.com';
  const apiUrl = `${baseUrl}/api`;
  try {
    const res = await fetch(`${apiUrl}/properties/${id}`, { 
      next: { revalidate: 60 } // Cache data for 60 seconds (high performance)
    });
    if (!res.ok) return null;
    return res.json();
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

  const imageBase = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'https://maprent-2.onrender.com';
  const imageUrl = property.images?.[0]?.startsWith('http') ? property.images[0] : `${imageBase}${property.images?.[0] || '/logo/Occupra logo.png'}`;

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

  redirect(`/?propertyId=${id}`);
}
