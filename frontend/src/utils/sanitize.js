/**
 * Occupra Security Sanitizer Utility
 * High-performance, lightweight sanitizer to prevent XSS when rendering dynamic HTML.
 */
export default function sanitizeHtmlText(dirtyHtml = '') {
  if (typeof dirtyHtml !== 'string') return '';

  // Remove script tags and their content
  let clean = dirtyHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove common inline event handlers (onmouseover, onload, onerror, onclick, etc.)
  clean = clean.replace(/\son[a-z]+\s*=\s*(['"])(.*?)\1/gi, '');
  clean = clean.replace(/\son[a-z]+\s*=\s*([^>\s]+)/gi, '');

  // Remove javascript: and data: pseudo-protocols from attributes
  clean = clean.replace(/href\s*=\s*(['"])\s*javascript:(.*?)\1/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*(['"])\s*javascript:(.*?)\1/gi, 'src=""');
  clean = clean.replace(/href\s*=\s*(['"])\s*data:(.*?)\1/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*(['"])\s*data:(.*?)\1/gi, 'src=""');

  // Remove iframe, object, embed tags
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*\/?>/gi, '');

  return clean;
}
