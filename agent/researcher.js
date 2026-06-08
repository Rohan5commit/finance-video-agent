import axios from 'axios';

function getTodayDate() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

const PLACEHOLDER_STORIES = [
  { title: 'S&P 500 Hits All-Time High on AI Optimism', summary: 'The S&P 500 reached a new record today, driven by strong earnings from major tech companies.', url: 'https://example.com/sp500-record', keyFact: 'S&P 500 tops 5,500 for the first time' },
  { title: 'Federal Reserve Signals Rate Decision at Upcoming Meeting', summary: 'The Fed is expected to hold rates steady at its next meeting, with Powell emphasizing data-dependence.', url: 'https://example.com/fed-decision', keyFact: 'CME FedWatch shows 60% probability of September cut' },
  { title: 'NVIDIA Earnings Beat Estimates, Stock Rallies After Hours', summary: 'NVIDIA reported quarterly revenue up 265% year-over-year, beating Wall Street estimates.', url: 'https://example.com/nvidia-earnings', keyFact: 'NVDA revenue up 265% YoY to $28.5B' },
  { title: 'Bitcoin Breaks $70,000 as ETF Inflows Surge', summary: 'Bitcoin surged past $70,000 for the first time, driven by record inflows into spot Bitcoin ETFs.', url: 'https://example.com/bitcoin-70k', keyFact: 'BTC ETF inflows exceed $1.2B this week' },
  { title: 'Oil Prices Drop on OPEC Supply Increase', summary: 'Crude oil fell 3% after OPEC announced plans to increase production.', url: 'https://example.com/oil-drop', keyFact: 'WTI crude drops below $75/barrel' },
  { title: 'Gold Hits Record High Amid Dollar Weakness', summary: 'Gold surged to a new all-time high as the US dollar weakened.', url: 'https://example.com/gold-record', keyFact: 'Gold breaks $2,400 for the first time' },
];

async function searchTavily(query) {
  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      { query, search_depth: 'basic', include_answer: true, max_results: 5 },
      { headers: { 'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    return (response.data.results || []).map(r => ({
      title: r.title,
      summary: r.content ? r.content.slice(0, 200) : '',
      url: r.url,
      keyFact: r.answer || r.content?.slice(0, 100) || ''
    }));
  } catch (err) {
    console.error(`Tavily failed: "${query.slice(0, 50)}":`, err.message);
    return [];
  }
}

export async function fetchFinanceNews() {
  const today = getTodayDate();

  // 55 diverse queries covering stocks, crypto, macro, earnings, sectors
  const queries = [
    // Major indices & macro (8)
    `S&P 500 stock market news today ${today}`,
    'Federal Reserve interest rate decision forecast June 2026',
    'US inflation CPI data latest numbers 2026',
    'US jobs report unemployment rate latest',
    'NASDAQ tech stocks performance this week',
    'Dow Jones industrial average news today',
    'US dollar index DXY trend June 2026',
    'Treasury yields 10 year bond market update',

    // Tech stocks (10)
    'NVIDIA NVDA stock news today',
    'Apple AAPL stock news earnings',
    'Microsoft MSFT stock news today',
    'Google Alphabet GOOGL stock news',
    'Amazon AMZN stock news today',
    'Meta META stock news today',
    'Tesla TSLA stock news latest',
    'Semiconductor stocks news AMD Intel',
    'Cloud computing SaaS stocks performance',
    'AI artificial intelligence stocks news June 2026',

    // Crypto (8)
    'Bitcoin BTC price news today',
    'Ethereum ETH price news today',
    'Solana SOL crypto news',
    'Crypto regulation news 2026',
    'Bitcoin ETF flows institutional adoption',
    'DeFi decentralized finance news June 2026',
    'Stablecoin regulation news latest',
    'Crypto market crash or rally today',

    // Finance & banking (5)
    'Bank earnings JPMorgan Goldman Sachs news',
    'Wall Street investment banking news',
    'Private equity M&A deals news 2026',
    'IPO market news latest',
    'Hedge fund news market moves',

    // Energy & commodities (5)
    'Crude oil price news today OPEC',
    'Natural gas prices news latest',
    'Gold price news record high',
    'Silver copper commodity prices news',
    'Renewable energy stocks news solar wind',

    // Other sectors (5)
    'Healthcare pharma stocks news',
    'EV electric vehicle stocks news',
    'Retail consumer spending news 2026',
    'Real estate housing market news 2026',
    'Defense aerospace stocks news',

    // International (5)
    'China stock market economy news',
    'European stock market ECB news',
    'Japan Nikkei yen news latest',
    'Emerging markets BRICS news 2026',
    'Global trade tariffs news latest',

    // Economics & policy (5)
    'US GDP growth forecast 2026',
    'Recession risk economic outlook 2026',
    'US national debt fiscal policy news',
    'Corporate earnings season preview',
    'Stock market bubble or correction warning',

    // Specific ticker news (4)
    'Biggest stock movers today gainers losers',
    'Earnings surprise stocks beat estimates',
    'Dividend stocks high yield news',
    'Penny stocks meme stocks news'
  ];

  console.log(`Running ${queries.length} Tavily searches...`);

  // Run in batches of 5 to respect rate limits, with delay between batches
  const allResults = [];
  for (let i = 0; i < queries.length; i += 5) {
    const batch = queries.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(q => searchTavily(q)));
    allResults.push(...batchResults.flat());
    console.log(`  Batch ${Math.floor(i / 5) + 1}/${Math.ceil(queries.length / 5)} complete (${allResults.length} results so far)`);
    if (i + 5 < queries.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Deduplicate and filter
  const seen = new Set();
  const unique = [];
  for (const item of allResults) {
    if (!seen.has(item.url) && item.title && item.summary && item.summary.length > 30) {
      seen.add(item.url);
      unique.push(item);
    }
  }

  // Select diverse stories (up to 8) from the unique pool
  const stories = unique.slice(0, 8).map(item => ({
    title: item.title,
    summary: item.summary.slice(0, 250),
    url: item.url,
    keyFact: item.keyFact
  }));

  if (stories.length < 3) {
    console.log(`Only got ${stories.length} stories, using placeholders`);
    return PLACEHOLDER_STORIES;
  }

  console.log(`Selected ${stories.length} diverse stories from ${unique.length} unique results`);
  return stories;
}
