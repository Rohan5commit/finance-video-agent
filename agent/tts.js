import { EdgeTTS } from 'node-edge-tts';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOICE = 'en-US-AnaNeural';
const OUT_DIR = path.resolve(__dirname, '../out');

async function generateSegment(text, filename) {
  if (!text || text.trim().length === 0) return null;
  const tts = new EdgeTTS();
  await tts.save({ voice: VOICE, text }, filename);
  return filename;
}

export async function generateAudio(script) {
  console.log('Generating TTS audio for all scenes...');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const audioFiles = [];
  let fullText = '';
  for (const scene of script.scenes) {
    if (scene.spokenText) fullText += scene.spokenText + ' ';
  }

  const chunks = [];
  let chunk = '';
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    if ((chunk + sentence).length > 1000 && chunk.length > 0) {
      chunks.push(chunk.trim());
      chunk = sentence;
    } else {
      chunk += ' ' + sentence;
    }
  }
  if (chunk.trim()) chunks.push(chunk.trim());

  console.log(`  Narration split into ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const audioPath = path.join(OUT_DIR, `narration_${i}.mp3`);
    console.log(`  Generating chunk ${i + 1}/${chunks.length}...`);
    try {
      await generateSegment(chunks[i], audioPath);
      audioFiles.push(audioPath);
    } catch (err) {
      console.error(`  TTS failed for chunk ${i}:`, err.message);
    }
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`TTS complete: ${audioFiles.length} files`);
  return audioFiles;
}

// Merge audio files into a single narration track
export function mergeAudioFiles(audioFiles) {
  if (audioFiles.length === 0) return null;

  const mergedPath = path.join(OUT_DIR, 'narration.mp3');

  if (audioFiles.length === 1) {
    fs.copyFileSync(audioFiles[0], mergedPath);
    console.log('Single audio file, copied as narration.mp3');
    return mergedPath;
  }

  // Create ffmpeg concat file
  const concatList = audioFiles.map(f => `file '${f}'`).join('\n');
  const listPath = path.join(OUT_DIR, 'concat_list.txt');
  fs.writeFileSync(listPath, concatList);

  console.log('Merging audio files with ffmpeg...');
  try {
    execSync(`ffmpeg -f concat -safe 0 -i "${listPath}" -c:a libmp3lame -q:a 2 "${mergedPath}" -y`, {
      stdio: 'pipe',
      timeout: 30000
    });
    console.log(`Audio merged: ${mergedPath}`);
    return mergedPath;
  } catch (err) {
    console.error('ffmpeg merge failed:', err.message);
    return null;
  }
}

// Merge audio into video using ffmpeg
export function mergeAudioWithVideo(videoPath, audioPath, outputPath) {
  if (!fs.existsSync(audioPath)) {
    console.log('No audio to merge, keeping video as-is');
    return videoPath;
  }

  console.log('Merging audio into video with ffmpeg...');
  try {
    execSync(
      `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${outputPath}" -y`,
      { stdio: 'pipe', timeout: 60000 }
    );
    console.log(`Video with audio: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.error('Audio-video merge failed:', err.message);
    return videoPath; // return original video as fallback
  }
}

export function writeAudioMetadata(script, audioFiles, outputDir = OUT_DIR) {
  const totalChars = script.scenes.reduce((sum, s) => sum + (s.spokenText?.length || 0), 0);
  const estimatedDurationMs = totalChars * 55;
  let charOffset = 0;
  const sceneTimings = script.scenes.map(scene => {
    const length = scene.spokenText?.length || 0;
    const startMs = charOffset * 55;
    const durationMs = length * 55;
    charOffset += length;
    return { id: scene.id, startMs, durationMs };
  });

  const metadata = {
    audioFiles: audioFiles.map(f => path.relative(outputDir, f)),
    estimatedTotalDurationMs,
    sceneTimings,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(path.join(outputDir, 'audio_metadata.json'), JSON.stringify(metadata, null, 2));
  return metadata;
}
