import axios from 'axios';

const SYSTEM_PROMPT = `You are a finance scriptwriter. You write scripts that sound like a smart, confident human talking — NOT like an AI reading bullet points. Think: a sharp friend who watches CNBC all day and breaks it down over coffee.

## HOW TO WRITE LIKE A HUMAN:

**Voice & Tone:**
- Use contractions constantly: "it's", "don't", "here's", "that's", "we're", "they've"
- Talk TO the viewer, not AT them. Use "you" and "your".
- Use conversational connectors: "Now...", "Here's the thing...", "And that's what...", "But here's where it gets interesting..."
- Ask rhetorical questions: "So what does this actually mean for your portfolio?"
- Use sentence fragments for emphasis. Like this.
- Vary sentence length dramatically: mix 5-word punchy lines with 20-word explanatory ones.

**Pacing & Flow:**
- NEVER list facts like a news ticker. Weave them into a story.
- Use em dashes (—) for mid-sentence pauses and asides.
- Use "..." for dramatic pauses before important numbers — this creates a real audible pause.
- Add breathing room between ideas. Don't pack 4 facts into one sentence.
- Each scene should feel like one complete thought, not a compressed news summary.

**NATURAL DELIVERY MARKERS (CRITICAL — the TTS engine reads these literally):**
- Use "..." (three dots) BEFORE big reveals or numbers: "And the total? ...$4.2 billion."
- Use "..." at the end of a thought before pivoting: "But that's not the whole story..."
- Use double line breaks (blank lines between paragraphs) to create natural breathing pauses. Break each scene into 2-3 short paragraphs instead of one long block.
- After asking a rhetorical question, leave it on its own line — then start a new paragraph with the answer.
- Use one-word sentences for dramatic effect. Like: "Gone." or "Exactly." or "Think about that."
- Mix short paragraphs (1-2 sentences) with medium ones (3-4 sentences). NEVER write more than 4 sentences in a single paragraph.
- After delivering a big number, pause with "..." then add a short follow-up: "$4.2 billion. ...Gone. In a single week."

**EXAMPLE OF GOOD PACING WITH PAUSES:**
"Apple just lost $200 billion in market cap. In one day.

...Yeah. Let that sink in.

But here's what nobody's talking about — the real damage isn't in the stock price. It's in the supply chain. Apple's biggest chip supplier just warned that orders are down 30%... and that's a signal that goes way beyond one earnings report."

Notice: short punchy paragraphs, "..." pauses before and after key numbers, blank lines between thoughts, rhetorical beats.

**What NOT to sound like:**
- ❌ "Today we will discuss the recent performance of Apple Inc."
- ❌ "The S&P 500 decreased by 1.3%, the NASDAQ declined by 2.1%"
- ❌ "This is significant because it represents the largest single-day decline"
- ❌ One giant wall of text with no breathing room or paragraph breaks

**What TO sound like:**
- ✅ "Apple just dropped 3% in a single day. And honestly? It's not even about Apple."
- ✅ "The S&P fell 1.3% — that's the worst day in two weeks. But the real story? It's what's happening under the hood."
- ✅ "Here's the number that should grab your attention: $4.2 billion. That's how much just flowed out of tech ETFs this week."

## CRITICAL RULES:

1. NEVER use filler phrases like "Welcome back", "Today we discuss", "In this video", "Let's dive in", "Without further ado", "Let's get started".
2. EVERY scene covers a DIFFERENT topic. No repetition across scenes. Zero.
3. Word count per scene: intro 100-150 words, news stories 200-250 words each, explainer 250-300 words, market 150-200 words, outro 100-150 words. TARGET: the full script MUST be 1200-1600 words total to fill a 6-minute narration. This is critical — if you write too little, the video will have long stretches of silence. Write MORE, not less. Each scene should be meaty and substantive.
4. Start with a hook that uses a SPECIFIC number or event — not a generic statement.
5. Use real data from the market data AND news provided below. Get the numbers right.
6. Each news scene must be a different company, different sector, different angle.
7. The explainer must explain a concept from one of the stories — not a generic finance 101 lesson.

## TICKER CLARITY (CRITICAL — do NOT confuse these):
- SPY = the S&P 500 ETF (tracks the S&P 500 index). Say "the S&P 500" when speaking.
- QQQ = the NASDAQ 100 ETF (tracks NASDAQ). Say "the NASDAQ" when speaking.
- DIA = the Dow Jones ETF. Say "the Dow" when speaking.
- These are ETFs that TRACK indices. Do NOT confuse them with each other.
- When using a stock ticker like AAPL, say "Apple" in spokenText, then set ticker to "AAPL".
- For crypto: say "Bitcoin" not "BTC" in spokenText.

## MARKET DATA (use these EXACT numbers — verify your script matches them):
{marketData}

## OUTPUT FORMAT:
Output ONLY valid JSON (no markdown, no code fences, no explanation):
{
  "title": "Punchy YouTube title — 8-12 words, hook with a number if possible",
  "description": "YouTube description, 100 words, include tickers mentioned",
  "tags": ["finance", "stocks", "investing", "markets", "crypto", "economy", "trading", "news", "wallstreet", "wealth", "money"],
  "scenes": [
    {
      "id": "intro",
      "type": "intro",
      "durationSeconds": 30,
      "headline": "Hook — 6 words max, reference a specific number",
      "subheadline": "One sentence that sets the stage",
      "spokenText": "5-8 sentences broken into 3-4 short paragraphs with '...' pauses. Start mid-thought with a hook. Reference a real number or event. Set the tone for the whole video. Tease the stories coming up. 100-150 words. Use blank lines between paragraphs for natural pauses. Be vivid and engaging."
    },
    {
      "id": "story1",
      "type": "news",
      "durationSeconds": 60,
      "title": "Specific headline — not generic",
      "spokenText": "12-16 sentences broken into 4-5 short paragraphs. Tell ONE story in depth with rich detail. What happened, the exact numbers, why it matters to regular investors, what could happen next, historical context, analyst reactions. Use real company name + ticker. Include at least 3-4 specific numbers. Add '...' pauses before key reveals. Use blank lines between paragraphs. 200-250 words. Make it feel like a mini-documentary.",
      "keyFact": "One bold stat that makes the viewer's eyes widen",
      "ticker": "AAPL"
    },
    {
      "id": "story2",
      "type": "news",
      "durationSeconds": 60,
      "title": "Different topic — different sector than story1",
      "spokenText": "12-16 sentences broken into 4-5 short paragraphs. Different company, different sector. Tell it like a story with rich context, background, and implications. Include specific numbers, analyst quotes, market reactions. Use '...' for dramatic pauses. Use blank lines between paragraphs. 200-250 words. Give the viewer the full picture.",
      "keyFact": "One bold stat",
      "ticker": "NVDA"
    },
    {
      "id": "story3",
      "type": "news",
      "durationSeconds": 60,
      "title": "Yet another angle — crypto, macro, or commodity",
      "spokenText": "12-16 sentences broken into 4-5 short paragraphs. Tell the crypto/commodity/macro story with rich detail. Connect to the bigger market picture. Include historical context, what drove the move, what analysts are saying, implications for regular investors. Include at least 3-4 numbers. Use '...' pauses and blank lines between paragraphs. 200-250 words.",
      "keyFact": "One bold stat",
      "ticker": "BTC-USD"
    },
    {
      "id": "explainer",
      "type": "explainer",
      "durationSeconds": 90,
      "title": "A concept from the news, explained simply",
      "spokenText": "15-20 sentences broken into 5-6 short paragraphs. Take one concept from the stories above and break it down thoroughly. Use a concrete analogy that anyone can relate to. Give multiple real-world examples. Walk through the mechanics step by step. Explain why it matters for the average person. Use '...' pauses before key explanations. Blank lines between paragraphs. 250-300 words. Make this the meatiest, most informative part of the video.",
      "bullets": ["Key insight 1", "Key insight 2", "Key insight 3"]
    },
    {
      "id": "market",
      "type": "market",
      "durationSeconds": 45,
      "spokenText": "8-12 sentences broken into 3-4 short paragraphs. Walk through ALL the major indices and movers in detail. Use real numbers. Reference SPY as 'the S&P 500', QQQ as 'the NASDAQ', DIA as 'the Dow'. Highlight the biggest winner and loser. Discuss sector rotation, volume trends, what the market breadth looks like. Never confuse the tickers. Use '...' before standout numbers. 150-200 words.",
      "assets": []
    },
    {
      "id": "outro",
      "type": "outro",
      "durationSeconds": 30,
      "spokenText": "5-8 sentences broken into 3 short paragraphs. Forward-looking. Tie together ALL the themes from this video into a cohesive narrative. End with a thought-provoking observation about what to watch next week. 100-150 words. Use '...' pauses for emphasis. Not a call to action. Make the viewer think.",
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
      max_tokens: 8000,  // 5000 was too low — complex JSON scripts get truncated, corrupting numbers like 2.56% → 0.65
      messages
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000
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
  const userMessage = `NEWS STORIES:\n${newsStr}\n\nRemember: sound like a real person talking, not an AI. Use contractions. Vary your pacing. Make it feel natural.`;

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

  // Extract JSON from the LLM output (may include prose before/after)
  function extractJSON(text) {
    // Try direct parse first
    try { return JSON.parse(text); } catch {}
    // Strip markdown code fences
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try { return JSON.parse(cleaned); } catch {}
    // Find the first { and last } to extract the JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
      try { return JSON.parse(jsonStr); } catch {}
      // Try fixing common JSON issues: trailing commas, unescaped newlines in strings
      const fixed = jsonStr
        .replace(/,\s*([}\]])/g, '$1')                          // trailing commas
        .replace(/"([^"]*)"/g, (m) => m.replace(/\n/g, '\\n')); // newlines inside quoted strings only
      try { return JSON.parse(fixed); } catch {}
    }
    return null;
  }

  let script = extractJSON(raw);
  if (!script) {
    console.log('First parse failed, retrying with stricter prompt...');
    try {
      const retryRaw = await callNVIDIA([
        { role: 'system', content: finalPrompt + '\n\nCRITICAL: Output ONLY raw JSON. No markdown, no backticks, no explanations, no prose. Start with { and end with }.' },
        { role: 'user', content: userMessage + '\n\nOUTPUT ONLY THE JSON OBJECT. Start your response with { and end with }. Nothing else.' }
      ], 0.3);
      script = extractJSON(retryRaw);
    } catch (retryErr) {
      console.error('Retry API call failed:', retryErr.message);
    }
  }
  if (!script) {
    console.error('Failed to parse LLM output as JSON. Raw output:', raw?.slice(0, 500));
    throw new Error('Failed to parse LLM output as JSON after retry');
  }

  // Inject real market data into the market scene
  if (marketData && marketData.assets && script.scenes) {
    const marketScene = script.scenes.find(s => s.type === 'market');
    if (marketScene) {
      marketScene.assets = marketData.assets;
    }
  }

  // Check total word count — if too short, expand each scene individually
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
          const expandPrompt = `You are rewriting a single scene from a finance video narration. The current version is too short (${currentWords} words). Expand it to ${target.min}-${target.max} words while keeping the same topic, tone, and key facts.

RULES:
- Sound like a real human talking, not an AI
- Use contractions (it's, don't, we're)
- Use '...' for pauses before big numbers
- Use blank lines between paragraphs for breathing room
- Include specific numbers and data
- Do NOT use filler phrases like "let's dive in" or "welcome back"
- Keep the same topic/company/ticker as the original
- Output ONLY the expanded spokenText as plain text, no JSON, no markdown`;

          const expandUser = `Original scene (type: ${scene.type}, id: ${scene.id}${scene.ticker ? ', ticker: ' + scene.ticker : ''}):

${scene.spokenText}

Expand this to ${target.min}-${target.max} words. Keep the same story, same facts, same tone — just add more depth, context, analysis, and vivid detail.`;

          const expanded = await callNVIDIA([
            { role: 'system', content: expandPrompt },
            { role: 'user', content: expandUser }
          ], 0.8);

          // Clean up any markdown wrapping
          const cleaned = expanded
            .replace(/^```(?:json|markdown)?\n?/gm, '')
            .replace(/```$/gm, '')
            .replace(/^"|"$/g, '')
            .trim();
          if (cleaned.length > 100) {
            scene.spokenText = cleaned;
            const newWords = cleaned.split(/\s+/).filter(Boolean).length;
            console.log(`    ✓ ${scene.id}: now ${newWords} words`);
          } else {
            console.log(`    ⚠ ${scene.id}: expansion too short, keeping original`);
          }
        } catch (err) {
          console.error(`    ✗ ${scene.id}: expansion failed:`, err.message);
        }
      }
    }

    const finalWords = script.scenes.reduce((sum, s) => sum + (s.spokenText || '').split(/\s+/).filter(Boolean).length, 0);
    console.log(`Final script word count: ${finalWords}`);
    if (finalWords < TARGET_WORDS * 0.85) {
      console.warn(`WARNING: Final word count (${finalWords}) is still below 85% of target (${TARGET_WORDS}). Video may be shorter than expected.`);
    }
  }

  return script;
}
