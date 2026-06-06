/**
 * Central UI text formatters for Occupra Platform
 */

// Formats "2BHK" -> "2 BHK", etc.
export const formatBHK = (bhkStr) => {
  if (!bhkStr) return '';
  return bhkStr.replace(/(\d)(BHK)/i, '$1 $2').toUpperCase();
};

// Formats relative dates. "35d ago" -> "35 days ago"
export const formatDaysAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

// Formats area: "860 SQFT" -> "860 sq.ft"
export const formatArea = (areaStr) => {
  if (!areaStr) return '';
  return areaStr.toString().replace(/sqft/i, 'sq.ft');
};

// Converts ALL CAPS strings to Sentence Case (e.g., "UNFURNISHED" -> "Unfurnished")
export const toSentenceCase = (str) => {
  if (!str) return '';
  if (str.toUpperCase() === 'ANY') return 'Open to All';
  
  return str.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};
