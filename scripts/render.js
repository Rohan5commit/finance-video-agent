import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function render() {
  const entryPoint = path.resolve(__dirname, '../remotion/index.js');
  
  const bundled = await bundle({ entryPoint, webpackOverride: c => c });
  
  const comp = await selectComposition({ serveUrl: bundled, id: 'FinanceVideo' });
  
  fs.mkdirSync(path.resolve(__dirname, '../out'), { recursive: true });
  
  await renderMedia({
    composition: comp,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: path.resolve(__dirname, '../out/video.mp4'),
    inputProps: {},
    timeoutInMilliseconds: 3 * 60 * 1000,
  });
  
  console.log('Render complete: out/video.mp4');
}

render().catch(e => { console.error(e); process.exit(1); });
