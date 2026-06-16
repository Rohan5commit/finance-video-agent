import axios from 'axios';

const API_KEY = process.env.CURRENTS_API_KEY;
const BASE = 'https://api.currentsapi.services/v1';

function getTodayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00+00:00`;
}

function getYesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 2); // Go back 2 days to ensure we get articles
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00+00:00`;
}

/**
 * Search Currents API for articles matching keywords.
 */
async function searchNews(keywords, retries = 2) {
  if (!API_KEY) {
    throw new Error('CURRENTS_API_KEY not set. Get one at https://currentsapi.services');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(`${BASE}/search`, {
        params: {
          language: 'en',
          keywords,
          country: 'US',
          start_date: getYesterdayDate(),
          end_date: getTodayDate()
        },
        headers: { 'Authorization': API_KEY },
        timeout: 20000
      });

      if (response.data.status !== 'ok') {
        console.error(`  Currents API error for "${keywords.slice(0, 40)}": ${response.data.message || 'unknown'}`);
        return [];
      }

      return (response.data.news || []).map(a => ({
        title: a.title || '',
        summary: a.description || '',
        url: a.url || '',
        keyFact: a.description || '',
        source: a.author || '',
        publishedAt: a.published || '',
        category: a.category || []
      }));
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response.headers?.['retry-after'] || '10');
        console.warn(`  Rate limited. Waiting ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (err.response?.status === 401) {
        console.error('  Currents API: Invalid API key');
        return [];
      }

      const isLast = attempt === retries;
      if (isLast) {
        console.error(`  Currents API failed: "${keywords.slice(0, 40)}": ${err.message}`);
        return [];
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return [];
}

/**
 * Get latest news filtered by category.
 */
async function getLatestByCategory(category, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(`${BASE}/search`, {
        params: {
          language: 'en',
          category,
          country: 'US'
        },
        headers: { 'Authorization': API_KEY },
        timeout: 20000
      });

      if (response.data.status !== 'ok') return [];
      return (response.data.news || []).map(a => ({
        title: a.title || '',
        summary: a.description || '',
        url: a.url || '',
        keyFact: a.description || '',
        source: a.author || '',
        publishedAt: a.published || '',
        category: a.category || []
      }));
    } catch (err) {
      if (err.response?.status === 429) {
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }
      if (isLast) return [];
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return [];
}

// Deduplicate by URL and title similarity
function deduplicateResults(allResults) {
  const seen = new Set();
  const unique = [];

  for (const item of allResults) {
    if (!item.title || item.title.length < 10) continue;
    if (item.title === '[Removed]' || item.title === 'None') continue;
    if (seen.has(item.url)) continue;

    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (normalizedTitle.length < 10) continue;

    let isDuplicate = false;
    for (const existing of unique) {
      const existingNorm = existing.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (titleOverlap(normalizedTitle, existingNorm) > 0.7) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(item.url);
      unique.push(item);
    }
  }

  return unique;
}

function titleOverlap(a, b) {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w) && w.length > 2) intersection++;
  }
  const smaller = Math.min(wordsA.size, wordsB.size);
  return smaller > 0 ? intersection / smaller : 0;
}

/**
 * Fetch finance news using Currents API.
 * 
 * ~8 requests total — well within the free tier of 1,000/day.
 */
export async function fetchFinanceNews(minStories = 5) {
  if (!API_KEY) {
    throw new Error('CURRENTS_API_KEY not set. Get one at https://currentsapi.services');
  }

  console.log('Fetching finance news from Currents API...');

  const allResults = [];

  // ── Category-based searches (3 requests) ──
  console.log('  Fetching business + finance + technology headlines...');
  const [biz, finance, tech] = await Promise.all([
    getLatestByCategory('business'),
    getLatestByCategory('finance'),
    getLatestByCategory('technology')
  ]);
  allResults.push(...biz, ...finance, ...tech);
  console.log(`  Got ${biz.length} business, ${finance.length} finance, ${tech.length} tech`);

  // ── Keyword searches (8 requests) ──
  const queries = [
    'stock market S&P 500 NASDAQ Dow Jones',
    'Bitcoin cryptocurrency crypto',
    'NVIDIA Apple Tesla tech stocks',
    'earnings revenue profit quarterly results',
    'Federal Reserve interest rates Fed inflation CPI',
    'bonds treasury yields yield curve',
    'oil crude OPEC energy commodities',
    'IPO M&A merger acquisition buyout',
  ];

  for (const q of queries) {
    const results = await searchNews(q);
    allResults.push(...results);
    await new Promise(r => setTimeout(r, 300));
  }

  // Total: ~8 requests. Free tier: 1,000/day. Massive headroom.

  let unique = deduplicateResults(allResults);
  console.log(`  After dedup: ${unique.length} unique stories`);

  // Filter low quality and non-finance topics
  const nonFinanceCategories = new Set([
    'sports', 'entertainment', 'health', 'lifestyle', 'travel',
    'food', 'fashion', 'science', 'education', 'environment',
    'automotive', 'real estate', 'property', 'weather', 'religion',
    'arts', 'culture', 'gaming', 'music', 'movies', 'tv'
  ]);
  
  unique = unique.filter(item => {
    const hasTitle = item.title && item.title.length > 15;
    const hasSummary = item.summary && item.summary.length > 20;
    const isNotJunk = item.title !== '[Removed]' && item.title !== 'None';
    
    // Filter out non-finance categories
    const categories = item.category || [];
    const isNonFinance = categories.some(cat => 
      nonFinanceCategories.has(cat.toLowerCase())
    );
    
    return hasTitle && hasSummary && isNotJunk && !isNonFinance;
  });

  console.log(`  After filter: ${unique.length} stories`);

  if (unique.length < minStories) {
    console.warn(`  Only ${unique.length} stories. Running supplementary searches...`);
    const extra1 = await searchNews('biggest stock movers gainers losers today');
    const extra2 = await searchNews('IPO housing market real estate economy');
    const extra3 = await searchNews('earnings season guidance outlook');
    const extra4 = await searchNews('central bank monetary policy rate decision');
    allResults.push(...extra1, ...extra2, ...extra3, ...extra4);
    unique = deduplicateResults(allResults).filter(item =>
      item.title && item.title.length > 15 &&
      item.summary && item.summary.length > 20 &&
      item.title !== '[Removed]' && item.title !== 'None'
    );
    console.log(`  After supplementary: ${unique.length} stories`);
  }

  if (unique.length < 3) {
    throw new Error(`Failed to fetch enough news stories (${unique.length} found). Check CURRENTS_API_KEY at https://currentsapi.services`);
  }

  return pickDiverseStories(unique, minStories);
}

// Pick diverse stories covering different topics
function pickDiverseStories(unique, count) {
  const selected = [];
  const usedTopics = new Set();

  const topicKeywords = {
    'crypto': ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana', 'defi', 'blockchain'],
    'tech': ['nvidia', 'apple', 'microsoft', 'google', 'amazon', 'meta', 'tesla', 'semiconductor', 'chip', 'ai'],
    'macro': ['fed', 'federal reserve', 'interest rate', 'inflation', 'cpi', 'gdp', 'unemployment'],
    'banks': ['bank', 'jpmorgan', 'goldman', 'wall street', 'finance'],
    'energy': ['oil', 'crude', 'opec', 'energy', 'solar', 'renewable'],
    'commodities': ['gold', 'silver', 'copper', 'commodity'],
    'international': ['china', 'europe', 'japan', 'emerging market', 'global'],
    'healthcare': ['healthcare', 'pharma', 'drug', 'fda'],
    'realestate': ['housing', 'real estate', 'mortgage'],
  };

  for (const story of unique) {
    if (selected.length >= count) break;

    const combined = `${story.title || ''} ${story.summary || ''}`.toLowerCase();
    const storyTopics = Object.entries(topicKeywords)
      .filter(([_, keywords]) => keywords.some(kw => combined.includes(kw)))
      .map(([topic]) => topic);

    const hasNewTopic = storyTopics.some(t => !usedTopics.has(t));
    if (hasNewTopic || selected.length < 3) {
      selected.push(story);
      storyTopics.forEach(t => usedTopics.add(t));
    }
  }

  for (const story of unique) {
    if (selected.length >= count) break;
    if (!selected.includes(story)) selected.push(story);
  }

  return selected.slice(0, count).map(item => ({
    title: item.title,
    summary: item.summary.slice(0, 250),
    url: item.url,
    keyFact: item.keyFact
  }));
}
