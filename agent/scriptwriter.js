import axios from 'axios';

const SYSTEM_PROMPT = `You are a professional finance educator writing YouTube video scripts. Your voice is sharp, specific, and human — like a knowledgeable friend explaining the markets. NEVER use filler phrases like 'Welcome back', 'Today we discuss', 'In this video'. Start with a hook that references a specific number or event. Use rhetorical questions. Vary sentence length. Reference real tickers and real numbers from the news provided.

Output ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "title": "YouTube title — punchy, specific, curiosity-driving",
  "description": "YouTube description, 150 words, mentions key topics and timestamps",
  "tags": ["finance", "stocks", "investing", ...8 more relevant tags],
  "scenes": [
    {
      "id": "intro",
      "type": "intro",
      "durationSeconds": 25,
      "headline": "Main topic in 6 words max",
      "subheadline": "One sentence context",
      "spokenText": "The exact words spoken aloud. Hook sentence referencing a real number or event. 3-4 sentences total."
    },
    {
      "id": "story1",
      "type": "news",
      "durationSeconds": 65,
      "title": "Story headline",
      "spokenText": "4-5 sentences. Specific numbers. What happened, why it matters, what to watch.",
      "keyFact": "One bold stat shown on screen",
      "ticker": "AAPL or null"
    },
    {
      "id": "story2",
      "type": "news",
      "durationSeconds": 65,
      "title": "Story headline",
      "spokenText": "4-5 sentences. Specific numbers. What happened, why it matters, what to watch.",
      "keyFact": "One bold stat shown on screen",
      "ticker": "AAPL or null"
    },
    {
      "id": "story3",
      "type": "news",
      "durationSeconds": 65,
      "title": "Story headline",
      "spokenText": "4-5 sentences. Specific numbers. What happened, why it matters, what to watch.",
      "keyFact": "One bold stat shown on screen",
      "ticker": "AAPL or null"
    },
    {
      "id": "explainer",
      "type": "explainer",
      "durationSeconds": 70,
      "title": "Concept being explained",
      "spokenText": "60-70 word explanation. Use an analogy. Be concrete.",
      "bullets": ["Point 1", "Point 2", "Point 3", "Point 4"]
    },
    {
      "id": "market",
      "type": "market",
      "durationSeconds": 35,
      "spokenText": "Quick market rundown in 3 sentences.",
      "assets": [
        { "name": "S&P 500", "ticker": "SPX", "value": "5,480", "change": "+0.8%", "positive": true },
        { "name": "Bitcoin", "ticker": "BTC", "value": "$67,200", "change": "-1.2%", "positive": false },
        { "name": "10Y Yield", "ticker": "TNX", "value": "4.42%", "change": "+3bps", "positive": false },
        { "name": "Gold", "ticker": "GC", "value": "$2,341", "change": "+0.3%", "positive": true }
      ]
    },
    {
      "id": "outro",
      "type": "outro",
      "durationSeconds": 25,
      "spokenText": "Closing 2-3 sentences. Reference something said earlier. End with one forward-looking thought.",
      "summaryBullets": ["Recap point 1", "Recap point 2", "Recap point 3"]
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
      timeout: 90000
    }
  );
  return response.data.choices[0].message.content;
}

export async function generateScript(newsStories) {
  const userMessage = JSON.stringify(newsStories, null, 2);

  let raw;
  try {
    raw = await callNVIDIA([
      { role: 'system', content: SYSTEM_PROMPT },
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
        { role: 'system', content: SYSTEM_PROMPT + '\n\nCRITICAL: Output ONLY the raw JSON object. No markdown, no backticks, no explanation. Start with { and end with }.' },
        { role: 'user', content: userMessage }
      ], 0.3);

      const cleaned = retryRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      script = JSON.parse(cleaned);
    } catch (retryErr) {
      console.error('Retry also failed. Raw output:', raw?.slice(0, 500));
      throw new Error('Failed to parse LLM output as JSON after retry');
    }
  }

  return script;
}
