"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Edit2, AlertCircle, Sparkles, Image as ImageIcon, Tag, Globe, FileText } from 'lucide-react';
import api from '@/api/axios';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function BlogEditor({ isEdit = false, id }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    category: 'Landlord Tips',
    tags: '',
    author: 'Occupra Editorial',
    status: 'draft',
    seoTitle: '',
    seoDescription: ''
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false); // Toggle split preview on mobile

  const categories = [
    'Landlord Tips',
    'Tenant Guides',
    'Market Intelligence',
    'Neighborhood Spotlight',
    'Legal & Finance'
  ];

  // Fetch blog data if in edit mode
  useEffect(() => {
    if (isEdit && id) {
      const fetchBlogData = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/blogs/${id}`);
          const blog = res.data;
          
          setFormData({
            title: blog.title || '',
            slug: blog.slug || '',
            content: blog.content || '',
            excerpt: blog.excerpt || '',
            coverImage: blog.coverImage || '',
            category: blog.category || 'Landlord Tips',
            tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
            author: blog.author || 'Occupra Editorial',
            status: blog.status || 'draft',
            seoTitle: blog.seoTitle || '',
            seoDescription: blog.seoDescription || ''
          });
          setError(null);
        } catch (err) {
          console.error('[FETCH_EDIT_BLOG_ERROR]', err);
          setError('Failed to load blog data for editing.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchBlogData();
    }
  }, [isEdit, id]);

  // Handle title changes and auto-generate slug
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const updates = { title: val };
      // Auto-generate slug if it hasn't been manually locked/edited yet
      if (!isEdit || prev.slug === '') {
        updates.slug = val
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // remove special chars
          .replace(/\s+/g, '-')         // replace spaces with hyphens
          .replace(/-+/g, '-')          // replace multiple hyphens
          .substring(0, 50);             // cap length
      }
      return { ...prev, ...updates };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({
      ...prev,
      status: prev.status === 'published' ? 'draft' : 'published'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Basic Validation
    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim() || !formData.excerpt.trim()) {
      setError('Please fill in all required fields (Title, Slug, Excerpt, and Article Body).');
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const payload = {
        ...formData,
        // Make sure tags are a clean array
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      if (isEdit) {
        await api.put(`/blogs/${id}`, payload);
      } else {
        await api.post('/blogs', payload);
      }

      router.push('/admin/blogs');
      router.refresh();
    } catch (err) {
      console.error('[SUBMIT_BLOG_ERROR]', err);
      setError(err.response?.data?.msg || 'An error occurred while saving the article.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="flex-col gap-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex-between flex-wrap gap-4 border-b border-slate-100 pb-6">
        <div className="flex-row items-center gap-4">
          <button
            onClick={() => router.push('/admin/blogs')}
            className="btn btn-secondary !p-2.5 !h-10 !w-10 flex items-center justify-center !rounded-xl"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-col">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isEdit ? 'Modify Intelligence Report' : 'Draft New Market Intelligence'}
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {isEdit ? `Editing ID: ${id}` : 'Create search-engine ready housing documentation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="btn btn-secondary flex items-center gap-2 lg:hidden"
          >
            {previewMode ? <Edit2 size={14} /> : <Eye size={14} />}
            {previewMode ? 'Edit Article' : 'Live Preview'}
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2 shadow-sm"
          >
            <Save size={14} />
            {saving ? 'Encrypting & Saving...' : 'Save Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4 flex items-center gap-3 text-xs font-semibold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: Input Forms */}
        <form 
          onSubmit={handleSubmit} 
          className={`flex-col gap-6 ${previewMode ? 'hidden lg:flex' : 'flex'}`}
        >
          {/* Metadata Section */}
          <div className="card flex-col gap-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Document Registry Details</h2>
            </div>

            {/* Title */}
            <div className="flex-col gap-1.5">
              <label className="label-base !m-0">Article Title <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="e.g. Navigating Mysore Rental Aggreements: Landlord Protocol"
                className="input-base"
                required
              />
            </div>

            {/* Slug */}
            <div className="flex-col gap-1.5">
              <label className="label-base !m-0">Custom URL Slug <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g. mysore-rental-agreement-landlord-protocol"
                className="input-base !font-mono !text-xs !bg-slate-50"
                required
              />
              <span className="text-[10px] text-slate-400 font-semibold">
                Will be accessible at: /blog/{formData.slug || 'slug'}
              </span>
            </div>

            {/* Excerpt */}
            <div className="flex-col gap-1.5">
              <label className="label-base !m-0">Brief Grid Excerpt <span className="text-rose-500">*</span></label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={3}
                placeholder="A concise, high-impact summary of this report to attract search engines and user clicks in grid listings (max 160 chars)."
                className="input-base !h-auto !py-3 !text-xs !leading-relaxed"
                required
              />
            </div>

            {/* Grid 2 Column (Category & Tags) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex-col gap-1.5">
                <label className="label-base !m-0">Categorization <span className="text-rose-500">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-base !text-xs !font-bold !text-slate-700"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex-col gap-1.5">
                <label className="label-base !m-0">Tags (Comma Separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g. Mysore, Legal, Renting"
                  className="input-base"
                />
              </div>
            </div>

            {/* Cover image & Author */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex-col gap-1.5">
                <label className="label-base !m-0 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-slate-400" />
                  Cover Image URL
                </label>
                <input
                  type="text"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="Unsplash / Cloudinary / Supabase URL"
                  className="input-base"
                />
              </div>

              <div className="flex-col gap-1.5">
                <label className="label-base !m-0 flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  Author Profile
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Occupra Editorial"
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* Core Body Rich-Text editor */}
          <div className="card flex-col gap-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Article Manuscript Content <span className="text-rose-500">*</span></h2>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">Markdown Supported</span>
            </div>

            <div className="flex-col gap-2">
              <div className="bg-slate-50 border border-slate-200 border-b-0 rounded-t-xl px-4 py-2 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 select-none">
                <span className="bg-white border border-slate-200 px-2 py-1 rounded"># Header 1</span>
                <span className="bg-white border border-slate-200 px-2 py-1 rounded">## Header 2</span>
                <span className="bg-white border border-slate-200 px-2 py-1 rounded">**Bold**</span>
                <span className="bg-white border border-slate-200 px-2 py-1 rounded">*Italic*</span>
                <span className="bg-white border border-slate-200 px-2 py-1 rounded">[Link](url)</span>
                <span className="bg-white border border-slate-200 px-2 py-1 rounded">- List item</span>
              </div>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={16}
                placeholder="Write your beautiful article content here in standard Markdown formatting. Use headings, lists, tables, and links to optimize for Core Web Vitals..."
                className="input-base !h-auto !py-4 !font-mono !text-xs !leading-relaxed !rounded-t-none"
                required
              />
            </div>
          </div>

          {/* Advanced SEO Metadata overrides */}
          <div className="card flex-col gap-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Globe size={16} className="text-emerald-500" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Dynamic SEO Parameters</h2>
            </div>

            <div className="flex-col gap-4">
              <div className="flex-col gap-1.5">
                <label className="label-base !m-0">Custom SEO Title Override</label>
                <input
                  type="text"
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleChange}
                  placeholder={formData.title || "Occupra Search Engine Title Optimization"}
                  className="input-base"
                />
              </div>

              <div className="flex-col gap-1.5">
                <label className="label-base !m-0">Custom SEO Description Override</label>
                <textarea
                  name="seoDescription"
                  value={formData.seoDescription}
                  onChange={handleChange}
                  rows={2}
                  placeholder={formData.excerpt || "Google search result snippet block (150-160 characters)..."}
                  className="input-base !h-auto !py-3 !text-xs !leading-relaxed"
                />
              </div>

              {/* Status & Draft switches */}
              <div className="flex-row items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex-col">
                  <span className="text-xs font-bold text-slate-800">Publish to Public Feed</span>
                  <span className="text-[10px] text-slate-400 font-semibold leading-none">Drafts are hidden from search sitemaps</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleStatusToggle}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                    formData.status === 'published'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                  {formData.status === 'published' ? 'Published Online' : 'Saved Draft'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN: Split Screen LIVE Preview */}
        <div 
          className={`flex-col gap-6 sticky top-24 ${!previewMode ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="card !p-0 overflow-hidden min-h-[70vh] flex-col border border-slate-100 shadow-xl bg-slate-50">
            {/* Header banner */}
            <div className="bg-slate-900 text-white px-6 py-4 flex-row items-center justify-between border-b border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Live Client Preview Mode</span>
              <span className="text-[9px] uppercase font-bold text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full">Occupra Engine</span>
            </div>

            {/* Simulated Public Blog Article Rendering */}
            <div className="p-8 md:p-12 grow bg-white overflow-y-auto max-h-[70vh]">
              {/* Cover image simulate */}
              <div className="relative aspect-[16/8] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 mb-8">
                <img
                  src={formData.coverImage || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"}
                  alt="Preview Cover"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* simulated category */}
              <span className="uppercase tracking-[0.2em] text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 inline-block mb-4">
                {formData.category}
              </span>

              {/* Title simulated */}
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">
                {formData.title || 'Untitled Dynamic Report'}
              </h1>

              {/* Author & date metadata bar */}
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100 py-3 my-6 select-none">
                <span>By {formData.author || 'Editorial'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>Just Now</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>Dynamic Reading Time</span>
              </div>

              {/* Excerpt simulate */}
              <p className="text-slate-500 font-semibold text-sm leading-relaxed border-l-4 border-indigo-200 pl-4 mb-6 select-none">
                {formData.excerpt || 'Write an excerpt on the left panel to simulate summarized metadata indexing...'}
              </p>

              {/* Markdown Content Parser Simulate */}
              <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {formData.content ? (
                  // Custom rendering simulator for simple tags
                  formData.content
                    .replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-black mt-6 mb-2 tracking-tight text-slate-900">$1</h1>')
                    .replace(/^##\s+(.+)$/gm, '<h2 class="text-base font-black mt-5 mb-2 tracking-tight text-slate-900">$1</h2>')
                    .replace(/^###\s+(.+)$/gm, '<h3 class="text-sm font-black mt-4 mb-1 text-indigo-600">$1</h3>')
                    .replace(/^\*\*(.+)\*\*/gm, '<strong>$1</strong>')
                    .replace(/^\*(.+)\*/gm, '<em>$1</em>')
                    .split('\n').map((para, i) => {
                      if (para.startsWith('<h1') || para.startsWith('<h2') || para.startsWith('<h3')) {
                        return <div key={i} dangerouslySetInnerHTML={{ __html: para }} />;
                      }
                      return <p key={i} className="mb-4">{para}</p>;
                    })
                ) : (
                  <p className="text-slate-300 font-mono text-xs">
                    Start composing the markdown manuscript inside the left text editor. Headlines and formatting will update in real-time.
                  </p>
                )}
              </div>

              {/* Simulated Tags */}
              {formData.tags && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100 select-none">
                  {formData.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                      <Tag size={8} />
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
