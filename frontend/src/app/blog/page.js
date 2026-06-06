import { getBlogPosts } from "@/lib/markdown";
import Navbar from "@/components/Navbar";
import BlogListingClient from "@/components/BlogListingClient";
import { generatePlatformMetadata, generateBreadcrumbSchema } from "@/utils/seo";

// ─── Unified Dynamic Metadata ────────────────────────────────────────────────
export async function generateMetadata() {
  return generatePlatformMetadata({
    title: "Rental Insights & Housing Blog | Occupra Chronicle",
    description: "Stay up-to-date with landlord strategies, city rental pricing guides, and tenant protocols in Mysore and regional tech centers.",
    path: "/blog",
    image: "/logo/Occupra logo.png"
  });
}

// ─── Server Component fetching Blogs with fallback ────────────────────────────
async function getDbBlogs() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://maprent-2.onrender.com/api';
  try {
    const res = await fetch(`${apiUrl}/blogs`, { 
      next: { revalidate: 60 } // Revalidate caches every 60 seconds (high speed SSR)
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("[SERVER_BLOGS_FETCH_ERROR] Gracefully falling back to Markdown files...", err);
    return [];
  }
}

export default async function BlogListingPage() {
  // Fetch database blogs
  const dbBlogs = await getDbBlogs();
  
  // Load local Markdown files
  const markdownBlogs = getBlogPosts();

  // Combine both sources cleanly, ensuring unique slugs (favoring database articles)
  const allSlugs = new Set();
  const combinedBlogs = [];

  dbBlogs.forEach(blog => {
    if (blog.slug) {
      combinedBlogs.push({
        _id: blog._id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage || blog.image,
        category: blog.category || 'Insights',
        tags: blog.tags || [],
        author: blog.author || 'Occupra Editorial',
        readTime: blog.readTime || 3,
        createdAt: blog.createdAt || blog.date || new Date().toISOString()
      });
      allSlugs.add(blog.slug);
    }
  });

  markdownBlogs.forEach(blog => {
    if (blog.slug && !allSlugs.has(blog.slug)) {
      combinedBlogs.push({
        _id: blog.slug,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
        category: 'Market Intelligence',
        tags: [],
        author: blog.author || 'Editorial',
        readTime: 3,
        createdAt: blog.date || new Date().toISOString()
      });
      allSlugs.add(blog.slug);
    }
  });

  // Sort by date descending
  combinedBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Dynamic Breadcrumb Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' }
  ]);

  return (
    <>
      {/* Inject Breadcrumbs JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <Navbar />
      <BlogListingClient initialBlogs={combinedBlogs} />
    </>
  );
}
