import fs from 'fs';
import path from 'path';

const blogDirectory = path.join(process.cwd(), 'src/content/blog');

export function getBlogPosts() {
  if (!fs.existsSync(blogDirectory)) {
    fs.mkdirSync(blogDirectory, { recursive: true });
    
    // Create a high-quality sample post for SEO listing
    const samplePostContent = `---
title: "Top 5 Rental Areas in Mysore for Tech Professionals"
slug: "top-rental-areas-mysore"
date: "2026-05-24"
author: "Occupra Editorial"
excerpt: "Discover the most premium, secure, and well-connected neighborhoods in Mysore offering exceptional rental properties for tech professionals."
image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"
---
## The Rise of Mysore as a Tech Hub

Mysore is rapidly transforming into a preferred destination for tech professionals seeking a balanced lifestyle. With the expansion of major IT parks, modern infrastructure, and robust connectivity, finding the right neighborhood to rent a home has become a primary decision.

### 1. Gokulam
Gokulam is famous for its peaceful streets, lush green canopy, high-end organic cafes, and global yoga community. It offers excellent independent houses and premium apartments.

* **Ideal for**: Families and professionals seeking quiet, upscale residential living.
* **Average 2 BHK Rent**: ₹18,000 - ₹25,000 per month.

### 2. Vijayanagar
Vijayanagar is one of the largest and most well-planned residential layouts in Mysore. It offers wide roads, pristine parks, and excellent connectivity to the Outer Ring Road (ORR).

* **Ideal for**: Software engineers working near the industrial area or Hebbal IT corridor.
* **Average 2 BHK Rent**: ₹15,000 - ₹22,000 per month.

### 3. Hebbal
Hebbal is a thriving industrial and IT zone, hosting major tech employers. Renting here minimizes commute times significantly.

* **Ideal for**: Young professionals wanting to stay close to work.
* **Average 2 BHK Rent**: ₹12,000 - ₹18,000 per month.

---

## How to Find Verified Rentals on Occupra

Occupra makes rental discovery completely seamless:
1. **Interactive Map View**: Pan and zoom to your target tech parks.
2. **Instant Filters**: Refine by BHK type, price range, and vertical storeys.
3. **Verified Badges**: Rent with 100% confidence.
`;
    fs.writeFileSync(path.join(blogDirectory, 'top-rental-areas-mysore.md'), samplePostContent);
  }

  const filenames = fs.readdirSync(blogDirectory);
  const posts = filenames
    .filter(fn => fn.endsWith('.md'))
    .map(fn => {
      const filePath = path.join(blogDirectory, fn);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parts = fileContent.split('---');
      const frontmatter = {};
      
      if (parts[1]) {
        parts[1].split('\n').forEach(line => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            const key = line.substring(0, colonIdx).trim();
            let value = line.substring(colonIdx + 1).trim();
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            }
            frontmatter[key] = value;
          }
        });
      }

      return {
        ...frontmatter,
        content: parts.slice(2).join('---').trim(),
        slug: frontmatter.slug || fn.replace('.md', ''),
      };
    });

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getBlogPostBySlug(slug) {
  const posts = getBlogPosts();
  return posts.find(p => p.slug === slug);
}
