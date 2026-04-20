/**
 * India Search Assistant Utility
 * Optimized for handling Indian phonetic patterns and common misspellings at scale.
 */

const MAJOR_INDIAN_LOCATIONS = [
  // Tier 1 Metros
  { name: 'Bangalore', type: 'city', keywords: ['bengaluru', 'banglore', 'bluru', 'it city', 'garden city'] },
  { name: 'Mumbai', type: 'city', keywords: ['bombay', 'mumbay', 'mumbia', 'financial hub'] },
  { name: 'Delhi', type: 'city', keywords: ['dilli', 'new delhi', 'ncr'] },
  { name: 'Hyderabad', type: 'city', keywords: ['hydrabad', 'hyderabad city', 'hitech city', 'cyberabad'] },
  { name: 'Chennai', type: 'city', keywords: ['madras', 'chenai', 'chenay'] },
  { name: 'Pune', type: 'city', keywords: ['punee', 'punai', 'puna'] },
  { name: 'Kolkata', type: 'city', keywords: ['calcutta', 'kolkata city', 'bengal'] },
  { name: 'Gurgaon', type: 'city', keywords: ['gurugoan', 'gurugram', 'gurgon'] },
  { name: 'Noida', type: 'city', keywords: ['noidaa', 'new okhla industrial development authority'] },
  { name: 'Ahmedabad', type: 'city', keywords: ['ahmedbad', 'amdavad'] },

  // Tier 2 & 3 Growth Centers
  { name: 'Mysore', type: 'city', keywords: ['mysuru', 'mysur'] },
  { name: 'Kochi', type: 'city', keywords: ['cochin', 'cochone', 'kochi city'] },
  { name: 'Indore', type: 'city', keywords: ['indor', 'indore city'] },
  { name: 'Jaipur', type: 'city', keywords: ['pink city', 'jaipur city'] },
  { name: 'Chandigarh', type: 'city', keywords: ['chandigar', 'chndigarh'] },
  { name: 'Lucknow', type: 'city', keywords: ['lucknow city', 'lcknow'] },
  { name: 'Vijayawada', type: 'city', keywords: ['vizayawada', 'bezawada'] },
  { name: 'Visakhapatnam', type: 'city', keywords: ['vizag', 'vizak', 'visakha'] },
  { name: 'Coimbatore', type: 'city', keywords: ['kovai', 'coimbatour'] },
  { name: 'Thiruvananthapuram', type: 'city', keywords: ['trivandrum', 'thiru'] },

  // Prime Residential & Tech Hubs (Hyper-Local Bias)
  { name: 'Whitefield', type: 'area', city: 'Bangalore', keywords: ['whitfield', 'white field'] },
  { name: 'Koramangala', type: 'area', city: 'Bangalore', keywords: ['koramangla', 'kormangala'] },
  { name: 'Indiranagar', type: 'area', city: 'Bangalore', keywords: ['indira nagar', 'indiranagar'] },
  { name: 'Andheri', type: 'area', city: 'Mumbai', keywords: ['andhari', 'andheri east', 'andheri west'] },
  { name: 'Powai', type: 'area', city: 'Mumbai', keywords: ['poway', 'powai lake'] },
  { name: 'Gachibowli', type: 'area', city: 'Hyderabad', keywords: ['gachiboli', 'gachi bowli'] },
  { name: 'Jubilee Hills', type: 'area', city: 'Hyderabad', keywords: ['jubliee hills', 'jublee hills'] },
  { name: 'Salt Lake', type: 'area', city: 'Kolkata', keywords: ['saltlake', 'bidhannagar'] },
  { name: 'Hinjewadi', type: 'area', city: 'Pune', keywords: ['hinjwadi', 'hinjewadi it park'] },
  { name: 'Adyar', type: 'area', city: 'Chennai', keywords: ['adyar', 'adyar bridge'] },
  { name: 'Guindy', type: 'area', city: 'Chennai', keywords: ['guindy', 'guindy park'] }
];

// --- ⚡ Normalizer Logic ---
const normalize = (str) => {
  if (!str) return '';
  return str.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '') // Remove special characters & spaces
    .replace(/(.)\1+/g, '$1')   // Flatten double vowels/chars (e.g., Noidaa -> Noida)
    .replace(/oo/g, 'u')         // Phonetic mapping (Bengalooru -> Bengaluru)
    .replace(/ee/g, 'i')         // Phonetic mapping (Punee -> Puni)
};

// --- 🧠 Fuzzy Search Algorithm (Levenshtein) ---
const getLevenshteinDistance = (s1, s2) => {
  const len1 = s1.length, len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, (_, i) => [i]);
  for (let j = 1; j <= len2; j++) matrix[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[len1][len2];
};

/**
 * findClosestIndianLocation
 * @param {string} query - Raw user input
 * @returns {object} { bestMatch, suggestions, correctionBanner }
 */
export const findClosestIndianLocation = (query) => {
  if (!query || query.length < 3) return { bestMatch: null, suggestions: [] };

  const normQuery = normalize(query);
  let scoredMatches = MAJOR_INDIAN_LOCATIONS.map(loc => {
    // 1. Direct Search on Keywords
    const keywordMatches = loc.keywords.some(k => normalize(k).includes(normQuery));
    
    // 2. Fuzzy Score
    const dist = getLevenshteinDistance(normQuery, normalize(loc.name));
    
    // Calculate Score (lower is better)
    let score = dist;
    if (keywordMatches) score -= 2; // Priority boost for keyword matches
    if (loc.type === 'city') score -= 1; // Slight priority boost for major cities

    return { ...loc, score };
  });

  // Sort by score
  scoredMatches.sort((a, b) => a.score - b.score);

  const best = scoredMatches[0];
  const isCorrectionNeeded = best.score > 0 && normalize(query) !== normalize(best.name);

  // Fallback Logic: Return top 3 closest items
  return {
    bestMatch: best.score <= 3 ? best : null,
    suggestions: scoredMatches.slice(0, 3),
    isCorrection: isCorrectionNeeded && best.score <= 3
  };
};

/**
 * Cache Management for searches
 */
const SEARCH_CACHE_KEY = 'occupra_search_history';

export const getCachedSearch = (query) => {
  const cache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '{}');
  return cache[normalize(query)];
};

export const saveSearchToCache = (query, result) => {
  const cache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '{}');
  cache[normalize(query)] = result;
  localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
};
