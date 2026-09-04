import axios from 'axios';
import { validateScriptFacts } from './fact-checker.js';

const SYSTEM_PROMPT = `You are a finance video scriptwriter. Write like a smart friend breaking down markets over coffee — conversational, punchy, specific.

VOICE: Contractions, "you/your", rhetorical questions, sentence fragments for emphasis. Vary sentence length. Never list facts like a ticker.

PAKING: Use "..." before big numbers for dramatic pauses. Use blank lines between paragraphs (2-3 paragraphs per scene, max 4 sentences each). Use em dashes for asides.

NEVER use: "Welcome back", "Today we discuss", "Let's dive in", "In this video". NEVER fabricate earnings, price targets, ATH claims, or specific dates unless in the news data.

## SCENE STRUCTURE (7 scenes total):
1. INTRO (30s): Hook with a specific number, tease stories. 100-150 words.
2. STORY1 (60s): First news story — company/sector. 200-250 words. Include ticker.
3. STORY2 (60s): Different company/sector. 200-250 words.
4. STORY3 (60s): Crypto, macro, or commodity angle. 200-250 words.
5. EXPLAINER (90s): Explain a concept from the stories. 250-300 words. Include 3 bullet points.
6. MARKET (45s): Walk through indices using exact market data numbers. 150-200 words. Include asset panels.
7. OUTRO (30s): Tie themes together, forward-looking. 100-150 words. Include 3 summary bullets.

## ANTI-HALLUCINATION:
- ONLY state facts explicitly in the news stories or market data below
- Market data is REAL — use exact numbers, do not modify
- If unsure, use "recently" or "this week" instead of fabricating

## TICKERS: SPY=S&P 500, QQQ=NASDAQ, DIA=Dow. Say the index name in spokenText, set ticker field to the ETF ticker.

## MARKET DATA (use exact numbers):
{marketData}

## OUTPUT: Only valid JSON:
{
  "title": "Punchy title 8-12 words",
  "description": "YouTube description 100 words",
  "tags": ["finance","stocks","investing","markets","crypto","economy","trading","news","wallstreet","wealth","money"],
  "scenes": [
    {"id":"intro","type":"intro","durationSeconds":30,"headline":"Hook 6 words","subheadline":"One sentence","spokenText":"100-150 words"},
    {"id":"story1","type":"news","durationSeconds":60,"title":"Headline","spokenText":"200-250 words","keyFact":"One bold stat","ticker":"AAPL"},
    {"id":"story2","type":"news","durationSeconds":60,"title":"Headline","spokenText":"200-250 words","keyFact":"One bold stat","ticker":"NVDA"},
    {"id":"story3","type":"news","durationSeconds":60,"title":"Headline","spokenText":"200-250 words","keyFact":"One bold stat","ticker":"BTC-USD"},
    {"id":"explainer","type":"explainer","durationSeconds":90,"title":"Concept explained","spokenText":"250-300 words","bullets":["Insight 1","Insight 2","Insight 3"]},
    {"id":"market","type":"market","durationSeconds":45,"title":"Today's Markets","spokenText":"150-200 words","assets":[]},
    {"id":"outro","type":"outro","durationSeconds":30,"title":"Finance Brief","spokenText":"100-150 words","summaryBullets":["Takeaway 1","Takeaway 2","Takeaway 3"]}
  ]
}`;

async function callNVIDIA(messages, temperature = 0.75) {
  const response = await axios.post(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      model: process.env.NVIDIA_MODEL || 'openai/gpt-oss-20b',
      temperature,
      max_tokens: 4000,
      messages
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000
    }
  );
  if (!response.data?.choices?.length) {
    throw new Error('NVIDIA API returned empty response (no choices)');
  }
  return response.data.choices[0].message.content;
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch {}
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(jsonStr); } catch {}
    const fixed = jsonStr
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/"(?:[^"\\]|\\.)*"/g, (m) => m.replace(/\n/g, '\\n'));
    try { return JSON.parse(fixed); } catch {}
  }
  return null;
}

function validateScriptSchema(script) {
  const errors = [];
  if (!script || typeof script !== 'object') {
    return ['Script is not a valid object'];
  }
  if (!script.title || typeof script.title !== 'string') {
    errors.push('Missing or invalid "title"');
  }
  if (!script.description || typeof script.description !== 'string' || !script.description.trim()) {
    errors.push('Missing or empty "description"');
  }
  if (!Array.isArray(script.tags) || script.tags.length === 0) {
    errors.push('Missing or empty "tags" (must be non-empty array)');
  }
  if (!Array.isArray(script.scenes)) {
    errors.push('Missing or invalid "scenes" (must be array)');
  } else if (script.scenes.length < 5 || script.scenes.length > 9) {
    errors.push(`Expected 5-9 scenes, got ${script.scenes.length}`);
  } else {
    const validTypes = ['intro', 'news', 'explainer', 'market', 'outro'];
    for (const scene of script.scenes) {
      if (!scene.id || typeof scene.id !== 'string') {
        errors.push(`Scene missing "id"`);
      }
      if (!scene.type || !validTypes.includes(scene.type)) {
        errors.push(`Scene "${scene.id || 'unknown'}" has invalid type "${scene.type}"`);
      }
      if (typeof scene.durationSeconds !== 'number' || scene.durationSeconds <= 0) {
        errors.push(`Scene "${scene.id || 'unknown'}" has invalid durationSeconds`);
      }
      if (!scene.spokenText || typeof scene.spokenText !== 'string') {
        errors.push(`Scene "${scene.id || 'unknown'}" missing spokenText`);
      }
    }
  }
  return errors;
}

export async function generateScript(newsStories, marketData = null) {
  let marketStr = 'No market data provided.';
  if (marketData && marketData.assets) {
    marketStr = marketData.assets.map(a =>
      `${a.name} (${a.ticker}): ${a.value} (${a.change}, ${a.positive ? 'UP' : 'DOWN'})`
    ).join('\n');
  }

  const newsStr = newsStories.map((s, i) =>
    `${i + 1}. ${s.title}\n   Summary: ${s.summary}\n   Key Fact: ${s.keyFact}`
  ).join('\n\n');

  const finalPrompt = SYSTEM_PROMPT.replace('{marketData}', marketStr);
  const userMessage = `NEWS STORIES:\n${newsStr}\n\nSound like a real person. Use contractions. Vary pacing. Make it natural. Output ONLY JSON.`;

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

  let script = extractJSON(raw);
  if (!script) {
    console.log('First parse failed, retrying...');
    try {
      const retryRaw = await callNVIDIA([
        { role: 'system', content: finalPrompt + '\n\nOutput ONLY raw JSON. No markdown, no backticks. Start with { and end with }.' },
        { role: 'user', content: userMessage + '\n\nOUTPUT ONLY THE JSON OBJECT.' }
      ], 0.3);
      script = extractJSON(retryRaw);
    } catch (retryErr) {
      console.error('Retry failed:', retryErr.message);
    }
  }
  if (!script) {
    throw new Error('Failed to parse LLM output as JSON');
  }

  // Validate script schema
  const schemaErrors = validateScriptSchema(script);
  if (schemaErrors.length > 0) {
    console.error('Script schema validation failed:');
    schemaErrors.forEach(e => console.error(`  - ${e}`));
    throw new Error(`Invalid script schema: ${schemaErrors.join(', ')}`);
  }

  // Inject real market data into the market scene
  if (marketData && marketData.assets && script.scenes) {
    const marketScene = script.scenes.find(s => s.type === 'market');
    if (marketScene) {
      marketScene.assets = marketData.assets;
    }
  }

  // Check total word count
  const totalWords = script.scenes.reduce((sum, s) => {
    const words = (s.spokenText || '').split(/\s+/).filter(Boolean).length;
    return sum + words;
  }, 0);
  console.log(`Initial script word count: ${totalWords}`);

  const TARGET_WORDS = 1200;
  if (totalWords < TARGET_WORDS * 0.75) {
    console.log(`Script too short (${totalWords} words). Expanding each scene...`);

    const sceneTargets = {
      intro: { min: 120, max: 160 },
      news: { min: 220, max: 280 },
      explainer: { min: 280, max: 340 },
      market: { min: 180, max: 220 },
      outro: { min: 120, max: 160 }
    };

    for (const scene of script.scenes) {
      const target = sceneTargets[scene.type] || sceneTargets.news;
      const currentWords = (scene.spokenText || '').split(/\s+/).filter(Boolean).length;

      if (currentWords < target.min) {
        console.log(`  Expanding ${scene.id}: ${currentWords} → ${target.min}-${target.max} words`);
        try {
          const expanded = await callNVIDIA([
            {
              role: 'system',
              content: `Rewrite this finance video scene. Current: ${currentWords} words. Target: ${target.min}-${target.max} words. Same topic, tone, facts. Use "..." for pauses. Blank lines between paragraphs. Contractions. No filler phrases. ONLY use facts from the original or the news stories. Output ONLY the expanded text, no JSON.`
            },
            {
              role: 'user',
              content: `Scene (${scene.type}, ticker: ${scene.ticker || 'none'}):\n${scene.spokenText}\n\nNEWS: ${newsStr}\n\nExpand to ${target.min}-${target.max} words. Same facts, more depth.`
            }
          ], 0.7);

          const cleaned = expanded.replace(/^```(?:json|markdown)?\n?/gm, '').replace(/```$/gm, '').replace(/^"|"$/g, '').trim();
          if (cleaned.length > 100) {
            const originalText = scene.spokenText;
            scene.spokenText = cleaned;
            const { errors } = validateScriptFacts(script, newsStories, marketData);
            if (errors.length > 0) {
              console.warn(`    ⚠ ${scene.id}: expansion has hallucinations, keeping original`);
              scene.spokenText = originalText;
            } else {
              console.log(`    ✓ ${scene.id}: now ${cleaned.split(/\s+/).filter(Boolean).length} words`);
            }
          }
        } catch (err) {
          console.error(`    ✗ ${scene.id}: expansion failed:`, err.message);
        }
      }
    }

    const finalWords = script.scenes.reduce((sum, s) => sum + (s.spokenText || '').split(/\s+/).filter(Boolean).length, 0);
    console.log(`Final script word count: ${finalWords}`);
  }

  return script;
}
