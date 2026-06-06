import express from 'express';
import BlogPost from '../models/BlogPost.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// @route   GET /api/blogs
// @desc    Get all published blog posts (with filter and search support)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, tag, search, includeDrafts } = req.query;
    
    // Construct query object
    let query = {};
    
    // By default, public only sees published articles
    if (includeDrafts === 'true') {
      // In case we want drafts internally (e.g. for previewing in the admin panel)
      // Only check if requested, we'll secure preview tokens on the client
    } else {
      query.status = 'published';
    }

    // Category filter
    if (category && category !== 'all' && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Tag filter
    if (tag) {
      query.tags = tag;
    }

    // Keyword search filter (title, excerpt, content)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await BlogPost.find(query).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('[GET_BLOGS_ERROR]', err);
    res.status(500).json({ msg: 'Server Error fetching blog posts' });
  }
});

// @route   GET /api/blogs/all-admin
// @desc    Get all blogs including drafts for admin dashboard
// @access  Private (Admin)
router.get('/all-admin', adminAuth, async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('[GET_ADMIN_BLOGS_ERROR]', err);
    res.status(500).json({ msg: 'Server Error fetching admin blog list' });
  }
});

// @route   GET /api/blogs/slug/:slug
// @desc    Get single blog post by its URL slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug.toLowerCase() });
    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error('[GET_BLOG_SLUG_ERROR]', err);
    res.status(500).json({ msg: 'Server Error fetching single blog post' });
  }
});

// @route   GET /api/blogs/:id
// @desc    Get single blog post by database ID
// @access  Private (Admin)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error('[GET_BLOG_ID_ERROR]', err);
    res.status(500).json({ msg: 'Server Error fetching blog by ID' });
  }
});

// @route   POST /api/blogs
// @desc    Create a new blog post
// @access  Private (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      slug, 
      content, 
      excerpt, 
      coverImage, 
      category, 
      tags, 
      author, 
      status, 
      seoTitle, 
      seoDescription 
    } = req.body;

    if (!title || !slug || !content || !excerpt || !category) {
      return res.status(400).json({ msg: 'Please provide all required fields (title, slug, content, excerpt, category)' });
    }

    // Format slug nicely
    const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').trim();

    // Check unique slug
    const existing = await BlogPost.findOne({ slug: formattedSlug });
    if (existing) {
      return res.status(400).json({ msg: 'A blog post with this URL slug already exists.' });
    }

    const post = new BlogPost({
      title,
      slug: formattedSlug,
      content,
      excerpt,
      coverImage,
      category,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      author: author || 'Occupra Editorial',
      status: status || 'draft',
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error('[CREATE_BLOG_ERROR]', err);
    res.status(500).json({ msg: err.message || 'Server error creating blog post' });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update an existing blog post
// @access  Private (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      slug, 
      content, 
      excerpt, 
      coverImage, 
      category, 
      tags, 
      author, 
      status, 
      seoTitle, 
      seoDescription 
    } = req.body;

    let post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }

    // If slug is changed, check uniqueness
    if (slug && slug.toLowerCase() !== post.slug) {
      const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').trim();
      const existing = await BlogPost.findOne({ slug: formattedSlug });
      if (existing) {
        return res.status(400).json({ msg: 'A blog post with this URL slug already exists.' });
      }
      post.slug = formattedSlug;
    }

    // Apply updates
    if (title) post.title = title;
    if (content) post.content = content;
    if (excerpt) post.excerpt = excerpt;
    if (coverImage) post.coverImage = coverImage;
    if (category) post.category = category;
    if (author) post.author = author;
    if (status) post.status = status;
    if (seoTitle) post.seoTitle = seoTitle;
    if (seoDescription) post.seoDescription = seoDescription;
    
    if (tags) {
      post.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('[UPDATE_BLOG_ERROR]', err);
    res.status(500).json({ msg: 'Server error updating blog post' });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog post
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }
    res.json({ msg: 'Blog post deleted successfully' });
  } catch (err) {
    console.error('[DELETE_BLOG_ERROR]', err);
    res.status(500).json({ msg: 'Server error deleting blog post' });
  }
});

export default router;
