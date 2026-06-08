import axios from 'axios';

function getTodayDate() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

const PLACEHOLDER_STORIES = [
  {
    title: 'S&P 500 Hits All-Time High on AI Optimism',
    summary: 'The S&P 500 reached a new record today, driven by strong earnings from major tech companies. Investor sentiment remains bullish as AI-related stocks continue to outperform.',
    url: 'https://example.com/sp500-record',
    keyFact: 'S&P 500 tops 5,500 for the first time'
  },
  {
    title: 'Federal Reserve Signals Rate Decision at Upcoming Meeting',
    summary: 'The Fed is expected to hold rates steady at its next meeting, with Powell emphasizing data-dependence. Markets are pricing in a 60% chance of a cut later this year.',
    url: 'https://example.com/fed-decision',
    keyFact: 'CME FedWatch shows 60% probability of September cut'
  },
  {
    title: 'NVIDIA Earnings Beat Estimates, Stock Rallies After Hours',
    summary: 'NVIDIA reported quarterly revenue up 265% year-over-year, beating Wall Street estimates. The chipmaker cited unprecedented demand for its AI accelerators.',
    url: 'https://example.com/nvidia-earnings',
    keyFact: 'NVDA revenue up 265% YoY to $28.5B'
  },
  {
    title: 'Bitcoin Breaks $70,000 as ETF Inflows Surge',
    summary: 'Bitcoin surged past $70,000 for the first time, driven by record inflows into spot Bitcoin ETFs. Institutional adoption continues to accelerate.',
    url: 'https://example.com/bitcoin-70k',
    keyFact: 'BTC ETF inflows exceed $1.2B this week'
  }
];

async function searchTavily(query) {
  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    return (response.data.results || []).map(r => ({
      title: r.title,
      summary: r.content ? r.content.slice(0, 200) : '',
      url: r.url,
      keyFact: r.answer || r.content?.slice(0, 100) || ''
    }));
  } catch (err) {
    console.error(`Tavily search failed for "${query}":`, err.message);
    return [];
  }
}

export async function fetchFinanceNews() {
  const today = getTodayDate();
  
  try {
    const searches = await Promise.all([
      searchTavily(`finance news today stock market ${today}`),
      searchTavily('Federal Reserve interest rates inflation 2026'),
      searchTavily('S&P 500 earnings corporate news this week')
    ]);

    const allResults = searches.flat();
    const seen = new Set();
    const unique = [];
    
    for (const item of allResults) {
      if (!seen.has(item.url) && item.title && item.summary) {
        seen.add(item.url);
        unique.push(item);
      }
    }

    const stories = unique.slice(0, 4).map(item => ({
      title: item.title,
      summary: item.summary.slice(0, 250),
      url: item.url,
      keyFact: item.keyFact
    }));

    if (stories.length === 0) {
      console.log('No results from Tavily, using placeholder stories');
      return PLACEHOLDER_STORIES;
    }

    return stories;
  } catch (err) {
    console.error('News fetch error:', err.message);
    return PLACEHOLDER_STORIES;
  }
}
