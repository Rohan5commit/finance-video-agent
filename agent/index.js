import { fetchFinanceNews } from './researcher.js';
import { generateScript } from './scriptwriter.js';
import { uploadToYouTube } from './uploader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== Finance Video Agent ===');
  console.log('Step 1/5: Fetching finance news...');
  
  const stories = await fetchFinanceNews();
  console.log(`Got ${stories.length} stories`);

  console.log('Step 2/5: Generating script with NVIDIA NIM...');
  const script = await generateScript(stories);
  console.log(`Script generated: "${script.title}"`);

  console.log('Step 3/5: Writing script.json...');
  const scriptPath = path.resolve(__dirname, '../remotion/script.json');
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
  console.log('script.json written');

  console.log('Step 4/5: Rendering video with Remotion...');
  const { default: render } = await import('../scripts/render.js');
  await render();
  console.log('Render complete');

  console.log('Step 5/5: Uploading to YouTube...');
  try {
    const url = await uploadToYouTube(
      path.resolve(__dirname, '../out/video.mp4'),
      script.title,
      script.description,
      script.tags
    );
    console.log(`SUCCESS! Video uploaded: ${url}`);
  } catch (err) {
    console.error('YouTube upload failed:', err.message);
    console.log('Video saved to out/video.mp4. Upload manually.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
