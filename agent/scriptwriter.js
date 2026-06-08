import axios from 'axios';

const SYSTEM_PROMPT = `You are a professional finance educator writing YouTube video scripts. Your voice is sharp, specific, and human — like a knowledgeable friend explaining the markets.

CRITICAL RULES:
1. NEVER use filler phrases like 'Welcome back', 'Today we discuss', 'In this video', "Let's dive in", "Without further ado".
2. Start with a hook that references a specific number or event from the news.
3. EVERY scene MUST cover a DIFFERENT topic. Never repeat the same story or theme across scenes.
4. Keep spokenText UNDER 60 words per scene. Be punchy. If you can say it in 30 words, do it.
5. Use real tickers and real numbers from the news AND market data provided.
6. Vary sentence length. Mix short declarative sentences with longer explanatory ones.
7. Each news scene must have a UNIQUE story — different company, different sector, different angle.
8. The explainer should explain a concept RELEVANT to one of the stories (not generic).

MARKET DATA (use these EXACT numbers):
{marketData}

Output ONLY valid JSON (no markdown, no explanation):
{
  "title": "Punchy YouTube title — 8-12 words",
  "description": "YouTube description, 100 words",
  "tags": ["finance", "stocks", "investing", "markets", "crypto", "economy", "trading", "news", "wallstreet", "wealth", "money"],
  "scenes": [
    {
      "id": "intro",
      "type": "intro",
      "durationSeconds": 18,
      "headline": "Hook, 6 words max",
      "subheadline": "One sentence context",
      "spokenText": "2-3 punchy sentences. Hook with a real number or event from the news."
    },
    {
      "id": "story1",
      "type": "news",
      "durationSeconds": 35,
      "title": "Story 1 headline — specific and different from others",
      "spokenText": "3-4 sentences max. What happened, number, why it matters. Use real ticker.",
      "keyFact": "One bold stat",
      "ticker": "AAPL"
    },
    {
      "id": "story2",
      "type": "news",
      "durationSeconds": 35,
      "title": "Story 2 headline — different topic than story1",
      "spokenText": "3-4 sentences max. Different company/sector than story1.",
      "keyFact": "One bold stat",
      "ticker": "NVDA"
    },
    {
      "id": "story3",
      "type": "news",
      "durationSeconds": 35,
      "title": "Story 3 headline — different topic than story1/story2",
      "spokenText": "3-4 sentences max. Crypto, macro, or commodity angle.",
      "keyFact": "One bold stat",
      "ticker": "BTC"
    },
    {
      "id": "explainer",
      "type": "explainer",
      "durationSeconds": 40,
      "title": "Concept from the news, explained",
      "spokenText": "40-50 words. Explain a concept from one of the stories above. Use a concrete analogy.",
      "bullets": ["Key insight 1", "Key insight 2", "Key insight 3"]
    },
    {
      "id": "market",
      "type": "market",
      "durationSeconds": 25,
      "spokenText": "2-sentence market recap using the real numbers provided.",
      "assets": []
    },
    {
      "id": "outro",
      "type": "outro",
      "durationSeconds": 18,
      "spokenText": "1-2 closing sentences. Forward-looking. Reference something specific from the video.",
      "summaryBullets": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"]
    }
  ]
}`;

async function callNVIDIA(messages, temperature = 0.75) {
  const response = await axios.post(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
      temperature,
      max_tokens: 2500,
      messages
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
  );
  return response.data.choices[0].message.content;
}

export async function generateScript(newsStories, marketData = null) {
  // Build market data string
  let marketStr = 'No market data provided.';
  if (marketData && marketData.assets) {
    marketStr = marketData.assets.map(a =>
      `${a.name} (${a.ticker}): ${a.value} (${a.change}, ${a.positive ? 'UP' : 'DOWN'})`
    ).join('\n');
  }

  // Build news summary
  const newsStr = newsStories.map((s, i) =>
    `${i + 1}. ${s.title}\n   Summary: ${s.summary}\n   Key Fact: ${s.keyFact}`
  ).join('\n\n');

  const finalPrompt = SYSTEM_PROMPT.replace('{marketData}', marketStr);
  const userMessage = `NEWS STORIES:\n${newsStr}`;

  let raw;
  try {
    raw = await callNVIDIA([
      { role: 'system', content: finalPrompt },
      { role: 'user', content: userMessage }
    ], 0.75);
  } catch (err) {
    console.error('NVIDIA NIM API call failed:', err.message);
    throw err;
  }

  let script;
  try {
    script = JSON.parse(raw);
  } catch (parseErr) {
    console.log('First parse failed, retrying with stricter prompt...');
    try {
      const retryRaw = await callNVIDIA([
        { role: 'system', content: finalPrompt + '\n\nCRITICAL: Output ONLY raw JSON. No markdown, no backticks, no explanations.' },
        { role: 'user', content: userMessage }
      ], 0.3);
      const cleaned = retryRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      script = JSON.parse(cleaned);
    } catch (retryErr) {
      console.error('Retry failed. Raw output:', raw?.slice(0, 500));
      throw new Error('Failed to parse LLM output as JSON after retry');
    }
  }

  // Inject real market data into the market scene
  if (marketData && marketData.assets && script.scenes) {
    const marketScene = script.scenes.find(s => s.type === 'market');
    if (marketScene) {
      marketScene.assets = marketData.assets;
    }
  }

  return script;
}
