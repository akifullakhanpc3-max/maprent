import { getBlogPostBySlug, getBlogPosts } from "@/lib/markdown";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ChevronRight, Calendar, User, ArrowLeft, Tag, BookOpen, Clock } from "lucide-react";
import { generatePlatformMetadata, generateBreadcrumbSchema } from "@/utils/seo";
import sanitizeHtmlText from "@/utils/sanitize";

// ─── Server Dynamic Fetch Helper ──────────────────────────────────────────────
async function getDbBlogPost(slug) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://maprent-2.onrender.com/api';
  try {
    const res = await fetch(`${apiUrl}/blogs/slug/${slug}`, { 
      next: { revalidate: 60 } // High performance caching
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[SERVER_BLOG_FETCH_ERROR]", err);
    return null;
  }
}

async function getRelatedBlogs(category, currentSlug) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://maprent-2.onrender.com/api';
  try {
    const res = await fetch(`${apiUrl}/blogs?category=${category}`, { 
      next: { revalidate: 300 } 
    });
    if (res.ok) {
      const posts = await res.json();
      return posts.filter(p => p.slug !== currentSlug).slice(0, 3);
    }
    return [];
  } catch (err) {
    return [];
  }
}

// ─── Dynamic Metadata Generation ──────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  let post = await getDbBlogPost(slug);
  
  // Markdown fallback for SEO
  if (!post) {
    const mdPost = getBlogPostBySlug(slug);
    if (mdPost) {
      post = {
        title: mdPost.title,
        excerpt: mdPost.excerpt,
        coverImage: mdPost.image
      };
    }
  }

  if (!post) {
    return {
      title: "Article Not Found | Occupra Chronicle",
      description: "The requested housing report or intelligence article is not found."
    };
  }

  return generatePlatformMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.coverImage || '/logo/Occupra logo.png',
    type: 'article',
    publishDate: post.createdAt,
    author: post.author,
    tags: post.tags
  });
}

// ─── Simple Inline Markdown Parser ────────────────────────────────────────────
function parseMarkdownToHtml(markdown = '') {
  let html = markdown
    // Headings
    .replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-black mt-8 mb-4 tracking-tight text-slate-900">$1</h2>')
    .replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-black mt-6 mb-3 tracking-tight text-indigo-600">$1</h3>')
    // Bold & Italics
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\*\s+(.+)$/gm, '<li class="ml-6 list-disc mb-2 text-slate-600 font-medium">$1</li>')
    // Line breaks & paragraphs
    .replace(/\n\n/g, '</p><p class="mb-6 text-slate-600 leading-relaxed font-medium text-base">');

  return `<p class="mb-6 text-slate-600 leading-relaxed font-medium text-base">${html}</p>`;
}

// ─── Core Component ──────────────────────────────────────────────────────────
export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  
  // 1. Fetch from MongoDB
  let post = await getDbBlogPost(slug);
  let isMarkdown = false;

  // 2. Fetch from Local Markdown if not in DB
  if (!post) {
    const mdPost = getBlogPostBySlug(slug);
    if (mdPost) {
      post = {
        _id: mdPost.slug,
        title: mdPost.title,
        slug: mdPost.slug,
        excerpt: mdPost.excerpt,
        content: mdPost.content,
        coverImage: mdPost.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
        category: "Market Intelligence",
        tags: [],
        author: mdPost.author || "Editorial Team",
        readTime: 3,
        createdAt: mdPost.date || new Date().toISOString()
      };
      isMarkdown = true;
    }
  }

  // 3. 404 Fallback
  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 border border-amber-100 shadow-sm">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tighter">Article Not Found</h2>
        <p className="text-slate-500 text-sm max-w-xs mt-2">
          The intelligence report or housing guide you are trying to read could not be located on our servers.
        </p>
        <Link href="/blog" className="btn btn-primary mt-6 !px-10">
          Back to Chronicles
        </Link>
      </div>
    );
  }

  // 4. Fetch related stories
  const related = await getRelatedBlogs(post.category, post.slug);

  // 5. Structure JSON-LD Data Schema Markups
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.coverImage,
    "author": {
      "@type": "Organization",
      "name": "Occupra Editorial"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Occupra Platform",
      "logo": {
        "@type": "ImageObject",
        "url": "https://maprent-2.onrender.com/logo/Occupra logo.png"
      }
    },
    "datePublished": post.createdAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://maprent-2.onrender.com/blog/${post.slug}`
    }
  };

  const breadcrumbLd = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` }
  ]);

  // Parse and sanitize markdown html content securely
  const rawHtml = parseMarkdownToHtml(post.content);
  const sanitizedContent = sanitizeHtmlText(rawHtml);

  return (
    <>
      {/* Inject Structured Search Data into HTML Head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Navbar />

      <article className="min-h-screen bg-slate-50 animate-fade-in" style={{ paddingTop: '100px', paddingBottom: '120px' }}>
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          
          {/* Breadcrumb row */}
          <nav className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-6">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <ChevronRight size={10} className="text-slate-300" />
            <Link href="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link>
            <ChevronRight size={10} className="text-slate-300" />
            <span className="text-slate-500 truncate max-w-[200px]">{post.title}</span>
          </nav>

          {/* Back button */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-8">
            <ArrowLeft size={14} />
            Back to Chronicles
          </Link>

          {/* Article Header block */}
          <header className="flex-col gap-6 mb-10">
            <span className="uppercase tracking-[0.2em] text-[9px] font-black text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100 inline-block self-start">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight mt-2">
              {post.title}
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-semibold leading-relaxed border-l-4 border-indigo-200 pl-4 py-1 italic">
              {post.excerpt}
            </p>

            {/* Author card & readtime line */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-200/60 py-4 mt-6 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex-center text-white font-bold text-sm">
                  {post.author ? post.author.charAt(0) : 'E'}
                </div>
                <div className="flex-col">
                  <span className="text-xs font-bold text-slate-900">{post.author}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Occupra Specialist</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-300" />
                  {new Date(post.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-300" />
                  {post.readTime} min read
                </span>
              </div>
            </div>
          </header>

          {/* Cover image banner */}
          <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm mb-12">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Core Manuscript body content */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 shadow-sm mb-16">
            <div 
              className="prose prose-slate max-w-none text-slate-800"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Tags row */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-slate-100">
                {post.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    <Tag size={8} className="text-slate-400" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Related articles block */}
          {related && related.length > 0 && (
            <div className="border-t border-slate-200 pt-16 flex-col gap-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Related housing intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((blog) => (
                  <article key={blog._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-400/20 transition-all flex flex-col group">
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img 
                        src={blog.coverImage || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80"} 
                        alt={blog.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                    <div className="p-5 flex flex-col grow">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug tracking-tight">
                        <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold mt-2 line-clamp-2 grow">{blog.excerpt}</p>
                      <Link href={`/blog/${blog.slug}`} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-4 inline-flex items-center gap-1">
                        Read post <ChevronRight size={10} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </div>
      </article>
    </>
  );
}
