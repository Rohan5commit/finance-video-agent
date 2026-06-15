import { fetchFinanceNews } from './researcher.js';
import { fetchMarketData } from './marketdata.js';
import { generateScript } from './scriptwriter.js';
import { generateAudio, mergeAudioFiles, mergeAudioWithVideo, writeAudioMetadata } from './tts.js';
import { uploadToYouTube } from './uploader.js';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../out');

// Validate required environment variables
const required = ['CURRENTS_API_KEY', 'NVIDIA_API_KEY', 'TWELVE_DATA_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

async function main() {
  console.log('=== Finance Video Agent ===');

  // Step 1/8: Fetch news (55 searches)
  console.log('Step 1/8: Fetching finance news...');
  const stories = await fetchFinanceNews(3);
  console.log(`Got ${stories.length} stories`);

  // Step 2/8: Fetch market data
  console.log('Step 2/8: Fetching market data...');
  const marketData = await fetchMarketData();
  console.log(`Got data for ${marketData.allQuotes.length} symbols`);

  // Step 3/8: Generate script
  console.log('Step 3/8: Generating script with NVIDIA NIM...');
  const script = await generateScript(stories, marketData);
  console.log(`Script: "${script.title}" (${script.scenes.length} scenes)`);

  // Step 4/8: Validate script against provided facts
  console.log('Step 4/8: Validating script facts...');
  const { validateScriptFacts } = await import('./fact-checker.js');
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

  // Step 5/8: Write script.json
  console.log('Step 5/8: Writing script.json...');
  const scriptPath = path.resolve(__dirname, '../remotion/script.json');
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));

  // Step 6/8: Generate TTS audio (BEFORE render)
  console.log('Step 6/8: Generating TTS audio...');
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
  if (narrationPath && fs.existsSync(narrationPath)) {
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

  // Step 7/8: Render video
  console.log('Step 7/8: Rendering video with Remotion...');
  const { default: render } = await import('../scripts/render.js');
  await render();
  console.log('Render complete');

  // Step 8/8: Merge audio into video
  if (narrationPath && fs.existsSync(narrationPath)) {
    console.log('Step 8/8: Merging audio into video...');
    const videoPath = path.join(OUT_DIR, 'video.mp4');
    const finalPath = path.join(OUT_DIR, 'video_with_audio.mp4');
    const result = mergeAudioWithVideo(videoPath, narrationPath, finalPath);
    if (result !== videoPath) {
      fs.copyFileSync(result, videoPath);
      try { fs.unlinkSync(result); } catch {}
    }
  } else {
    console.log('Step 8/8: No audio to merge, skipping');
  }

  // Upload to YouTube
  console.log('\nUploading to YouTube...');
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
