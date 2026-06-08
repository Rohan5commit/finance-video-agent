import { fetchFinanceNews } from './researcher.js';
import { fetchMarketData } from './marketdata.js';
import { generateScript } from './scriptwriter.js';
import { generateAudio, mergeAudioFiles, mergeAudioWithVideo, writeAudioMetadata } from './tts.js';
import { uploadToYouTube } from './uploader.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../out');

async function main() {
  console.log('=== Finance Video Agent ===');

  // Step 1: Fetch news (55 searches)
  console.log('Step 1/7: Fetching finance news...');
  const stories = await fetchFinanceNews();
  console.log(`Got ${stories.length} stories`);

  // Step 2: Fetch market data
  console.log('Step 2/7: Fetching market data...');
  const marketData = await fetchMarketData();
  console.log(`Got data for ${marketData.allQuotes.length} symbols`);

  // Step 3: Generate script
  console.log('Step 3/7: Generating script with NVIDIA NIM...');
  const script = await generateScript(stories, marketData);
  console.log(`Script: "${script.title}" (${script.scenes.length} scenes)`);

  // Step 4: Write script.json
  console.log('Step 4/7: Writing script.json...');
  const scriptPath = path.resolve(__dirname, '../remotion/script.json');
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));

  // Step 5: Generate TTS audio (BEFORE render)
  console.log('Step 5/7: Generating TTS audio...');
  let narrationPath = null;
  try {
    const audioFiles = await generateAudio(script);
    if (audioFiles.length > 0) {
      narrationPath = mergeAudioFiles(audioFiles);
      writeAudioMetadata(script, audioFiles);
    }
  } catch (err) {
    console.error('TTS failed (continuing without audio):', err.message);
  }

  // Step 5.5: Scale scene durations to match actual audio length
  if (narrationPath && fs.existsSync(narrationPath)) {
    try {
      const audioDurationRaw = execSync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${narrationPath}"`,
        { stdio: 'pipe', timeout: 10000 }
      ).toString().trim();
      const audioDurationSec = parseFloat(audioDurationRaw) || 0;
      const totalSceneDuration = script.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

      if (audioDurationSec > 0 && totalSceneDuration > 0) {
        const scaleFactor = audioDurationSec / totalSceneDuration;
        console.log(`  Audio duration: ${audioDurationSec.toFixed(1)}s, Scene total: ${totalSceneDuration}s, Scale: ${scaleFactor.toFixed(2)}x`);

        // Scale each scene proportionally, with a minimum of 5 seconds per scene
        for (const scene of script.scenes) {
          const scaled = Math.max(5, Math.round(scene.durationSeconds * scaleFactor));
          scene.durationSeconds = scaled;
        }

        const newTotal = script.scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
        console.log(`  Scaled scene durations: ${script.scenes.map(s => s.durationSeconds).join('+')} = ${newTotal}s`);

        // Re-write script.json with updated durations
        const scriptPath = path.resolve(__dirname, '../remotion/script.json');
        fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
        console.log('  Updated script.json with audio-matched durations');
      }
    } catch (err) {
      console.warn('  Could not scale scene durations to audio:', err.message);
    }
  }

  // Step 6: Render video
  console.log('Step 6/7: Rendering video with Remotion...');
  const { default: render } = await import('../scripts/render.js');
  await render();
  console.log('Render complete');

  // Step 7: Merge audio into video
  if (narrationPath && fs.existsSync(narrationPath)) {
    console.log('Step 7/7: Merging audio into video...');
    const videoPath = path.join(OUT_DIR, 'video.mp4');
    const finalPath = path.join(OUT_DIR, 'video_with_audio.mp4');
    const result = mergeAudioWithVideo(videoPath, narrationPath, finalPath);
    if (result !== videoPath) {
      // Replace original with audio version
      fs.copyFileSync(result, videoPath);
    }
  } else {
    console.log('Step 7/7: No audio to merge, skipping');
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
