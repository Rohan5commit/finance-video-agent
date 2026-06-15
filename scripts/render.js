import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function render() {
  const entryPoint = path.resolve(__dirname, '../remotion/index.js');
  const outputPath = path.resolve(__dirname, '../out/video.mp4');

  let bundled;
  try {
    bundled = await bundle({ entryPoint, webpackOverride: c => c });
  } catch (err) {
    console.error('Failed to bundle Remotion project:', err.message);
    throw err;
  }

  const scriptPath = path.resolve(__dirname, '../remotion/script.json');
  const script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));

  let comp;
  try {
    comp = await selectComposition({ serveUrl: bundled, id: 'FinanceVideo', inputProps: { script } });
  } catch (err) {
    console.error('Failed to select composition:', err.message);
    throw err;
  }

  fs.mkdirSync(path.resolve(__dirname, '../out'), { recursive: true });

  try {
    await renderMedia({
      composition: comp,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { script },
      timeoutInMilliseconds: 15 * 60 * 1000,
    });
  } catch (err) {
    console.error('Failed to render video:', err.message);
    throw err;
  }

  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
    throw new Error('Render completed but output file is missing or empty');
  }

  console.log('Render complete: out/video.mp4');
}
