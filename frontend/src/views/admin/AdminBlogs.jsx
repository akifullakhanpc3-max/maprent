"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, CheckCircle2, AlertCircle, Edit, Trash2, ExternalLink, Calendar, User, Tag } from 'lucide-react';
import api from '@/api/axios';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch all blogs (both drafts and published)
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/blogs/all-admin');
      setBlogs(res.data);
      setError(null);
    } catch (err) {
      console.error('[FETCH_ADMIN_BLOGS_ERROR]', err);
      setError('Failed to fetch blog list. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Handle status toggle (Draft <-> Published)
  const handleToggleStatus = async (blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/blogs/${blog._id}`, { status: newStatus });
      setBlogs(blogs.map(b => b._id === blog._id ? { ...b, status: newStatus } : b));
    } catch (err) {
      console.error('[TOGGLE_STATUS_ERROR]', err);
      alert('Failed to update blog post status.');
    }
  };

  // Handle blog deletion
  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this blog post? This action is permanent.')) {
      return;
    }
    try {
      await api.delete(`/blogs/${id}`);
      setBlogs(blogs.filter(b => b._id !== id));
    } catch (err) {
      console.error('[DELETE_BLOG_ERROR]', err);
      alert('Failed to delete blog post.');
    }
  };

  // Get statistics
  const totalPosts = blogs.length;
  const publishedPosts = blogs.filter(b => b.status === 'published').length;
  const draftPosts = blogs.filter(b => b.status === 'draft').length;

  // Unique categories list
  const categories = ['all', ...new Set(blogs.map(b => b.category).filter(Boolean))];

  // Filter blogs based on search and category selection
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.author?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = categoryFilter === 'all' || blog.category?.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="flex-col gap-6 animate-fade-in">
      {/* Dashboard Header */}
      <div className="flex-between flex-wrap gap-4 border-b border-slate-100 pb-6">
        <div className="flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Editorial & Blogs CMS</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Configure, schedule, and write high-quality rental intelligence guides</p>
        </div>
        
        <Link href="/admin/blogs/create" className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Create New Post
        </Link>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card !p-6 flex-row gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex-center text-indigo-600">
            <FileText size={24} />
          </div>
          <div className="flex-col">
            <span className="text-2xl font-bold text-slate-900">{totalPosts}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Articles</span>
          </div>
        </div>

        <div className="card !p-6 flex-row gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-col">
            <span className="text-2xl font-bold text-slate-900">{publishedPosts}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Published Online</span>
          </div>
        </div>

        <div className="card !p-6 flex-row gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex-center text-amber-600">
            <AlertCircle size={24} />
          </div>
          <div className="flex-col">
            <span className="text-2xl font-bold text-slate-900">{draftPosts}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Draft Working Copies</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card !p-5 flex-row flex-wrap gap-4 items-center justify-between">
        <div className="flex-row items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full md:w-80 shadow-sm">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search article titles or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-800 placeholder-slate-400 w-full"
          />
        </div>

        <div className="flex-row items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-600 text-xs font-semibold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Blogs Database Grid */}
      <div className="card !p-0 overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cover & Title</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Author / Readtime</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Publish Date</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBlogs.length > 0 ? (
                filteredBlogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Cover & Title */}
                    <td className="p-4 max-w-sm">
                      <div className="flex items-center gap-4">
                        <img
                          src={blog.coverImage || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"}
                          alt={blog.title}
                          className="w-16 h-10 object-cover rounded-lg border border-slate-100"
                        />
                        <div className="flex-col gap-1 min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate block hover:text-indigo-600 transition-colors">
                            {blog.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block truncate">
                            /{blog.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="uppercase tracking-wider text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        {blog.category}
                      </span>
                    </td>

                    {/* Author & Read Time */}
                    <td className="p-4">
                      <div className="flex-col gap-0.5">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <User size={12} className="text-slate-400" />
                          {blog.author || 'Editorial'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {blog.readTime || 3} min read
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(blog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(blog)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border cursor-pointer hover:scale-105 transition-transform ${
                          blog.status === 'published'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${blog.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                        {blog.status}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {blog.status === 'published' && (
                          <Link
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            className="btn btn-secondary !p-2 !h-8 !w-8 flex items-center justify-center"
                            title="View Live Article"
                          >
                            <ExternalLink size={14} className="text-slate-400" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blogs/edit/${blog._id}`}
                          className="btn btn-secondary !p-2 !h-8 !w-8 flex items-center justify-center"
                          title="Edit Post"
                        >
                          <Edit size={14} className="text-indigo-600" />
                        </Link>
                        <button
                          onClick={() => handleDeleteBlog(blog._id)}
                          className="btn btn-secondary hover:!bg-rose-50 hover:!border-rose-100 !p-2 !h-8 !w-8 flex items-center justify-center"
                          title="Delete Post"
                        >
                          <Trash2 size={14} className="text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="flex-col items-center gap-2 max-w-sm mx-auto">
                      <FileText size={48} className="text-slate-300 animate-float" />
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight mt-2">No Blog Posts Found</h4>
                      <p className="text-slate-400 text-xs font-semibold">
                        We couldn't find any articles matching your search criteria. Create one to begin publishing!
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
