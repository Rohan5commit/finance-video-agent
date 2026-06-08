import { fetchFinanceNews } from './researcher.js';
import { fetchMarketData } from './marketdata.js';
import { generateScript } from './scriptwriter.js';
import { generateAudio, writeAudioMetadata } from './tts.js';
import { uploadToYouTube } from './uploader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== Finance Video Agent ===');

  // Step 1: Fetch news (55 searches)
  console.log('Step 1/6: Fetching finance news...');
  const stories = await fetchFinanceNews();
  console.log(`Got ${stories.length} stories`);

  // Step 2: Fetch real market data from Twelve Data
  console.log('Step 2/6: Fetching market data...');
  const marketData = await fetchMarketData();
  console.log(`Got data for ${marketData.allQuotes.length} symbols`);

  // Step 3: Generate script
  console.log('Step 3/6: Generating script with NVIDIA NIM...');
  const script = await generateScript(stories, marketData);
  console.log(`Script: "${script.title}" (${script.scenes.length} scenes)`);

  // Step 4: Write script.json
  console.log('Step 4/6: Writing script.json...');
  const scriptPath = path.resolve(__dirname, '../remotion/script.json');
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));

  // Step 5: Render video
  console.log('Step 5/6: Rendering video with Remotion...');
  const { default: render } = await import('../scripts/render.js');
  await render();
  console.log('Render complete');

  // Step 6: Generate TTS audio (after video render succeeds)
  console.log('Step 6/6: Generating TTS audio...');
  try {
    const audioFiles = await generateAudio(script);
    if (audioFiles.length > 0) {
      writeAudioMetadata(script, audioFiles);
      console.log(`Generated ${audioFiles.length} audio files`);
    }
  } catch (err) {
    console.error('TTS generation failed (non-fatal):', err.message);
  }

  // Upload to YouTube (skip for now if TTS not ready)
  console.log('\nUploading to YouTube...');
  try {
    const url = await uploadToYouTube(
      path.resolve(__dirname, '../out/video.mp4'),
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
