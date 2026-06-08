import axios from 'axios';

const API_KEY = process.env.TWELVE_DATA_API_KEY;
const BASE = 'https://api.twelvedata.com';

async function quote(symbol) {
  try {
    const r = await axios.get(`${BASE}/quote`, {
      params: { symbol, apikey: API_KEY },
      timeout: 10000
    });
    const d = r.data;
    return {
      symbol,
      name: d.name || symbol,
      price: parseFloat(d.close || d.price || 0).toFixed(2),
      change: parseFloat(d.change || 0).toFixed(2),
      percentChange: parseFloat(d.percent_change || 0).toFixed(2),
      positive: parseFloat(d.change) >= 0
    };
  } catch (e) {
    console.error(`Twelve Data fetch failed for ${symbol}:`, e.message);
    return null;
  }
}

export async function fetchMarketData() {
  console.log('Fetching real-time market data from Twelve Data...');

  const symbols = [
    'SPX', 'IXIC', 'DJI',
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA',
    'BTC/USD', 'ETH/USD', 'SOL/USD',
    'GC', 'CL', 'TNX'
  ];

  // Batch in groups of 8 (free tier limit: 8/min)
  const results = [];
  for (let i = 0; i < symbols.length; i += 8) {
    const batch = symbols.slice(i, i + 8);
    const batchResults = await Promise.all(batch.map(s => quote(s)));
    results.push(...batchResults.filter(Boolean));
    if (i + 8 < symbols.length) {
      console.log(`  Batch complete, waiting for rate limit...`);
      await new Promise(r => setTimeout(r, 10000)); // 10s between batches
    }
  }

  const valid = results.filter(r => r !== null);
  console.log(`Got market data for ${valid.length}/${symbols.length} symbols`);

  // Format for the script
  const assets = valid
    .filter(r => ['SPX', 'IXIC', 'DJI', 'BTC/USD', 'ETH/USD', 'GC', 'CL', 'TNX'].includes(r.symbol))
    .map(r => ({
      name: r.name,
      ticker: r.symbol,
      value: r.price.startsWith('$') ? r.price : `$${r.price}`,
      change: r.positive ? `+${r.percentChange}%` : `${r.percentChange}%`,
      positive: r.positive
    }));

  const topMovers = valid
    .filter(r => !['SPX', 'IXIC', 'DJI', 'BTC/USD', 'ETH/USD', 'GC', 'CL', 'TNX'].includes(r.symbol))
    .sort((a, b) => Math.abs(parseFloat(b.percentChange)) - Math.abs(parseFloat(a.percentChange)))
    .slice(0, 5);

  return { assets, topMovers, allQuotes: valid };
}
