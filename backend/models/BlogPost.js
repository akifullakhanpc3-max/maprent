import mongoose from 'mongoose';

const BlogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a blog title'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Please provide a url slug'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Please provide the blog article body content'],
  },
  excerpt: {
    type: String,
    required: [true, 'Please provide a short summary for listings'],
    trim: true,
  },
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
  },
  category: {
    type: String,
    required: [true, 'Please select an article category'],
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  author: {
    type: String,
    default: 'Occupra Editorial',
    trim: true,
  },
  readTime: {
    type: Number,
    default: 3, // Reading time in minutes
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  seoTitle: {
    type: String,
    trim: true,
  },
  seoDescription: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true
});

// Calculate readTime before saving
BlogPostSchema.pre('save', function(next) {
  if (this.content) {
    const wordsPerMinute = 225;
    const words = this.content.trim().split(/\s+/).length;
    this.readTime = Math.ceil(words / wordsPerMinute);
  }
  next();
});

const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
export default BlogPost;
