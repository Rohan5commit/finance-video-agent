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

    // Twelve Data returns error codes for unsupported symbols
    if (d.code) {
      console.error(`  Twelve Data error for ${symbol}: ${d.message || d.code}`);
      return null;
    }

    return {
      symbol,
      name: d.name || symbol,
      price: parseFloat(d.close || d.price || 0).toFixed(2),
      change: parseFloat(d.change || 0).toFixed(2),
      percentChange: parseFloat(d.percent_change || 0).toFixed(2),
      positive: parseFloat(d.change) >= 0
    };
  } catch (e) {
    console.error(`  Twelve Data fetch failed for ${symbol}:`, e.message);
    return null;
  }
}

export async function fetchMarketData() {
  if (!API_KEY) {
    console.error('TWELVE_DATA_API_KEY not set. Skipping market data.');
    return { assets: [], topMovers: [], allQuotes: [] };
  }

  console.log('Fetching real-time market data from Twelve Data...');

  // Indices use ETFs since Twelve Data free tier doesn't support ^GSPC/^IXIC/^DJI directly
  const symbols = [
    // Major indices via ETFs
    'SPY',    // S&P 500
    'QQQ',    // NASDAQ
    'DIA',    // Dow Jones
    // Major stocks
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA',
    // Crypto
    'BTC/USD', 'ETH/USD', 'SOL/USD',
    // Commodities
    'GC',     // Gold futures
    'CL'      // Crude oil
  ];

  // Process sequentially to respect rate limits (8/min on free tier)
  const results = [];
  const BATCH_SIZE = 7; // Stay under 8/min
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(s => quote(s)));
    results.push(...batchResults.filter(Boolean));
    if (i + BATCH_SIZE < symbols.length) {
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} complete (${results.length} ok), waiting 30s for rate limit...`);
      await new Promise(r => setTimeout(r, 30000)); // 30s between batches
    }
  }

  const valid = results.filter(r => r !== null);
  console.log(`Got market data for ${valid.length}/${symbols.length} symbols`);

  // Indices/commodities/crypto for the market overview
  const indexSymbols = ['SPY', 'QQQ', 'DIA', 'BTC/USD', 'ETH/USD', 'GC', 'CL'];
  const assets = valid
    .filter(r => indexSymbols.includes(r.symbol))
    .map(r => ({
      name: r.name,
      ticker: r.symbol,
      value: `$${r.price}`,
      change: r.positive ? `+${r.percentChange}%` : `${r.percentChange}%`,
      positive: r.positive
    }));

  // Top movers: just the stocks, sorted by abs(% change)
  const stockSymbols = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA'];
  const topMovers = valid
    .filter(r => stockSymbols.includes(r.symbol))
    .sort((a, b) => Math.abs(parseFloat(b.percentChange)) - Math.abs(parseFloat(a.percentChange)))
    .slice(0, 5);

  return { assets, topMovers, allQuotes: valid };
}
