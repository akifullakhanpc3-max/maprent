"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Search, FileText } from 'lucide-react';

export default function BlogListingClient({ initialBlogs }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Hardcoded premium categories to match design guidelines
  const categories = [
    'All',
    'Landlord Tips',
    'Tenant Guides',
    'Market Intelligence',
    'Legal & Finance'
  ];

  // Filtering logic
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      activeCategory === 'All' || 
      blog.category.toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex-col gap-12">
        
        {/* Banner Section */}
        <div className="text-center mb-4 flex-col items-center gap-4">
          <span className="uppercase tracking-[0.25em] text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
            Occupra Chronicle
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mt-4 leading-none">
            Rental Intelligence & Guides
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto mt-2 leading-relaxed font-medium">
            Navigating properties, landlord pricing analysis, and lease protocols made completely transparent.
          </p>
        </div>

        {/* Filters and Search Hub */}
        <div className="card !p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-slate-100">
          {/* Categories Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 border-indigo-600'
                    : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex-row items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-full md:w-72 shadow-inner">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search reports or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-semibold text-slate-800 placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* Dynamic Grid list */}
        {filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((post) => (
              <article 
                key={post.slug} 
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-400/20 transition-all duration-300 flex flex-col group"
              >
                {/* Cover Image with Glass Tag */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img 
                    src={post.coverImage} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-white/10">
                    {post.category}
                  </div>
                </div>

                {/* Card Content details */}
                <div className="p-6 md:p-8 flex flex-col grow">
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-300" />
                      {new Date(post.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="flex items-center gap-1.5">
                      <User size={12} className="text-slate-300" />
                      {post.author || "Editorial"}
                    </span>
                  </div>

                  <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors tracking-tight">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-slate-500 text-xs md:text-sm font-medium mt-3 leading-relaxed grow">
                    {post.excerpt}
                  </p>

                  <div className="pt-6 border-t border-slate-50 mt-6 flex-between">
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                    >
                      Read Full Analysis
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <span className="text-[10px] text-slate-400 font-bold">{post.readTime} min read</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card !p-16 text-center max-w-md mx-auto flex-col items-center gap-4 animate-slide-up">
            <FileText size={48} className="text-indigo-300 animate-float" />
            <div className="flex-col gap-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">No intelligence reports found</h3>
              <p className="text-slate-400 text-xs font-semibold max-w-xs leading-relaxed">
                There are no published articles matching your keyword or selected category pills. Try checking other options!
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
