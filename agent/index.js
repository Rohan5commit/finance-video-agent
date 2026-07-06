import { fetchFinanceNews } from './researcher.js';
import { fetchMarketData } from './marketdata.js';
import { generateScript } from './scriptwriter.js';
import { generateAudio, mergeAudioFiles, mergeAudioWithVideo, writeAudioMetadata } from './tts.js';
import { uploadToYouTube } from './uploader.js';
import { validateScriptFacts } from './fact-checker.js';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../out');

/**
 * Use NVIDIA NIM API to verify a story is finance/business related.
 * Returns { isFinance: boolean, reason: string }
 */
async function verifyStoryIsFinance(story) {
  const prompt = `You are a finance news classifier. Determine if this news story is related to finance, business, markets, investing, or the economy.

Story Title: ${story.title}
Story Summary: ${story.summary}

Reply with ONLY a JSON object:
{"isFinance": true/false, "reason": "brief explanation"}

Examples of finance/business topics: stocks, companies, earnings, markets, crypto, banking, interest rates, GDP, inflation, mergers, IPOs, tech stocks, commodities, real estate market.

Examples of non-finance topics: sports scores, celebrity news, weather, entertainment, politics (unless market-moving), crime, health/medical research, lifestyle, travel.`;

  try {
    const response = await axios.post(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct',
        temperature: 0.1,
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const content = response.data.choices[0].message.content;
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return { isFinance: false, reason: 'Failed to parse AI response' };
  } catch (err) {
    console.warn(`  Warning: Could not verify story "${story.title.slice(0, 40)}...": ${err.message}`);
    return { isFinance: true, reason: 'Verification failed, assuming finance' };
  }
}

/**
 * Filter stories to only include finance-related ones using NVIDIA API.
 */
async function filterFinanceStories(stories) {
  console.log('  Verifying stories are finance-related...');
  const verified = [];
  
  for (const story of stories) {
    const result = await verifyStoryIsFinance(story);
    if (result.isFinance) {
      console.log(`    ✓ "${story.title.slice(0, 50)}..." - ${result.reason}`);
      verified.push(story);
    } else {
      console.log(`    ✗ FILTERED: "${story.title.slice(0, 50)}..." - ${result.reason}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`  Kept ${verified.length} of ${stories.length} stories`);
  return verified;
}

// Validate required environment variables
const required = [
  'CURRENTS_API_KEY', 'NVIDIA_API_KEY', 'TWELVE_DATA_API_KEY',
  'YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'
];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

async function main() {
  console.log('=== Finance Video Agent ===');

  // Step 1/9: Fetch news (55 searches)
  console.log('Step 1/9: Fetching finance news...');
  let stories = await fetchFinanceNews(10);
  console.log(`Got ${stories.length} stories`);

  // Step 1.5/9: Verify stories are finance-related using NVIDIA API
  console.log('Step 1.5/9: Verifying stories are finance-related...');
  stories = await filterFinanceStories(stories);
  if (stories.length < 1) {
    console.error('No finance-related stories found after verification. Aborting.');
    process.exit(1);
  }
  console.log(`Using ${stories.length} verified finance stories`);

  // Step 2/9: Fetch market data
  console.log('Step 2/9: Fetching market data...');
  const marketData = await fetchMarketData();
  console.log(`Got data for ${marketData.allQuotes.length} symbols`);

  // Step 3/9: Generate script
  console.log('Step 3/9: Generating script with NVIDIA NIM...');
  const script = await generateScript(stories, marketData);
  console.log(`Script: "${script.title}" (${script.scenes.length} scenes)`);

  // Step 4/9: Validate script against provided facts
  console.log('Step 4/9: Validating script facts...');
  const validation = validateScriptFacts(script, stories, marketData);
  if (validation.errors.length > 0) {
    console.error('❌ CRITICAL: Script contains fabricated facts:');
    validation.errors.forEach(e => console.error(`  - ${e}`));
    console.error('Aborting pipeline to prevent publishing misinformation.');
    process.exit(1);
  }
  if (validation.warnings.length > 0) {
    console.warn('⚠ Warnings (non-blocking):');
    validation.warnings.forEach(w => console.warn(`  - ${w}`));
  }
  console.log('  ✓ Script validation passed');

  // Step 5/9: Write script.json
  console.log('Step 5/9: Writing script.json...');
  const scriptPath = path.resolve(__dirname, '../remotion/script.json');
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));

  // Step 6/9: Generate TTS audio (BEFORE render)
  console.log('Step 6/9: Generating TTS audio...');
  let narrationPath = null;
  try {
    const audioFiles = await generateAudio(script);
    if (audioFiles.length > 0) {
      narrationPath = mergeAudioFiles(audioFiles);
      writeAudioMetadata(script, audioFiles);
    }
  } catch (err) {
    console.error('TTS failed:', err.message);
    if (process.env.ALLOW_SILENT_VIDEO !== 'true') {
      console.error('Aborting pipeline. Set ALLOW_SILENT_VIDEO=true to override.');
      process.exit(1);
    }
    console.warn('Continuing without audio (ALLOW_SILENT_VIDEO=true)...');
  }

  // Step 6.5: Scale scene durations to match actual audio length
  if (narrationPath && fs.existsSync(narrationPath) && script.scenes && Array.isArray(script.scenes)) {
    try {
      const audioDurationRaw = execFileSync(
        'ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', narrationPath],
        { stdio: 'pipe', timeout: 10000 }
      ).toString().trim();
      const audioDurationSec = parseFloat(audioDurationRaw) || 0;
      const totalSceneDuration = script.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

      if (audioDurationSec > 0 && totalSceneDuration > 0) {
        const scaleFactor = audioDurationSec / totalSceneDuration;
        console.log(`  Audio duration: ${audioDurationSec.toFixed(1)}s, Scene total: ${totalSceneDuration}s, Scale: ${scaleFactor.toFixed(2)}x`);

        for (const scene of script.scenes) {
          const scaled = Math.max(5, Math.round(scene.durationSeconds * scaleFactor));
          scene.durationSeconds = scaled;
        }

        const newTotal = script.scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
        console.log(`  Scaled scene durations: ${script.scenes.map(s => s.durationSeconds).join('+')} = ${newTotal}s`);

        fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
        console.log('  Updated script.json with audio-matched durations');
      }
    } catch (err) {
      console.warn('  Could not scale scene durations to audio:', err.message);
    }
  }

  // Step 7/9: Render video
  console.log('Step 7/9: Rendering video with Remotion...');
  const { default: render } = await import('../scripts/render.js');
  await render();
  console.log('Render complete');

  // Step 8/9: Merge audio into video
  if (narrationPath && fs.existsSync(narrationPath)) {
    console.log('Step 8/9: Merging audio into video...');
    const videoPath = path.join(OUT_DIR, 'video.mp4');
    const finalPath = path.join(OUT_DIR, 'video_with_audio.mp4');
    const result = mergeAudioWithVideo(videoPath, narrationPath, finalPath);
    if (result !== videoPath) {
      fs.copyFileSync(result, videoPath);
      try { fs.unlinkSync(result); } catch {}
    }
  } else {
    console.log('Step 8/9: No audio to merge, skipping');
  }

  // Step 9/9: Upload to YouTube
  console.log('\nStep 9/9: Uploading to YouTube...');
  try {
    const url = await uploadToYouTube(
      path.join(OUT_DIR, 'video.mp4'),
      script.title,
      script.description,
      script.tags
    );
    console.log(`SUCCESS! ${url}`);
  } catch (err) {
    console.error('YouTube upload failed:', err.message);
    console.log('Video saved to out/video.mp4');
  }
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
