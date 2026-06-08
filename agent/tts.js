import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../out');
const SCRIPTS_DIR = path.resolve(__dirname, '../scripts');

// Kokoro TTS voice — am_michael is clear, authoritative male narrator
const VOICE = process.env.KOKORO_VOICE || 'am_michael';

function splitIntoChunks(text, maxChars = 3000) {
  const chunks = [];
  let chunk = '';
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    if ((chunk + sentence).length > maxChars && chunk.length > 0) {
      chunks.push(chunk.trim());
      chunk = sentence;
    } else {
      chunk += ' ' + sentence;
    }
  }
  if (chunk.trim()) chunks.push(chunk.trim());
  return chunks;
}

export async function generateAudio(script) {
  console.log('Generating TTS audio with Kokoro...');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Collect all spokenText from scenes
  let fullText = '';
  for (const scene of script.scenes) {
    if (scene.spokenText) fullText += scene.spokenText.trim() + '\n\n';
  }

  // Split into chunks (Kokoro handles longer text but we chunk for manageability)
  const chunks = splitIntoChunks(fullText, 3000);
  console.log(`  Narration split into ${chunks.length} chunks`);

  // Write each chunk to a temp file for the Python script
  const chunkDir = path.join(OUT_DIR, 'text_chunks');
  fs.mkdirSync(chunkDir, { recursive: true });
  for (let i = 0; i < chunks.length; i++) {
    fs.writeFileSync(path.join(chunkDir, `chunk_${String(i).padStart(3, '0')}.txt`), chunks[i]);
  }

  // Run Kokoro TTS Python script
  const kokoroScript = path.join(SCRIPTS_DIR, 'kokoro_tts.py');
  const audioOutDir = path.join(OUT_DIR, 'kokoro_audio');

  try {
    console.log(`  Running Kokoro TTS (voice: ${VOICE})...`);
    execSync(
      `python3 "${kokoroScript}" "${chunkDir}" "${audioOutDir}" "${VOICE}"`,
      { stdio: 'inherit', timeout: 300000 }
    );
  } catch (err) {
    console.error('Kokoro TTS failed:', err.message);
    throw new Error('Kokoro TTS generation failed');
  }

  // Read manifest to get generated audio files
  const manifestPath = path.join(audioOutDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Kokoro TTS manifest not found — generation may have failed');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const wavFiles = manifest.audio_files || [];

  if (wavFiles.length === 0) {
    throw new Error('Kokoro TTS produced no audio files');
  }

  // Convert WAV to MP3 using ffmpeg
  const audioFiles = [];
  for (let i = 0; i < wavFiles.length; i++) {
    const wavPath = wavFiles[i];
    const mp3Path = wavPath.replace('.wav', '.mp3');
    try {
      execSync(
        `ffmpeg -i "${wavPath}" -codec:a libmp3lame -q:a 2 "${mp3Path}" -y`,
        { stdio: 'pipe', timeout: 30000 }
      );
      const size = fs.statSync(mp3Path).size;
      console.log(`    ✓ ${path.basename(mp3Path)} (${Math.round(size / 1024)}KB)`);
      audioFiles.push(mp3Path);
    } catch (err) {
      console.error(`  ffmpeg convert failed for ${wavPath}:`, err.message);
    }
  }

  console.log(`TTS complete: ${audioFiles.length}/${wavFiles.length} MP3 files`);

  if (audioFiles.length === 0) {
    throw new Error('No MP3 files produced — check ffmpeg installation');
  }

  // Clean up temp text chunks
  try { fs.rmSync(chunkDir, { recursive: true }); } catch {}

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

  try {
    execSync('ffmpeg -version', { stdio: 'pipe', timeout: 5000 });
  } catch {
    console.error('ffmpeg not found! Audio merge requires ffmpeg.');
    return null;
  }

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
    const stderr = err.stderr?.toString() || '';
    console.error('ffmpeg merge failed:', stderr || err.message);
    return null;
  }
}

// Merge audio into video using ffmpeg
export function mergeAudioWithVideo(videoPath, audioPath, outputPath) {
  if (!fs.existsSync(audioPath)) {
    console.log('No audio to merge, keeping video as-is');
    return videoPath;
  }

  try {
    execSync('ffmpeg -version', { stdio: 'pipe', timeout: 5000 });
  } catch {
    console.error('ffmpeg not found! Video-audio merge requires ffmpeg.');
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
    const stderr = err.stderr?.toString() || '';
    console.error('Audio-video merge failed:', stderr || err.message);
    return videoPath;
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
    estimatedDurationMs,
    sceneTimings,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(path.join(outputDir, 'audio_metadata.json'), JSON.stringify(metadata, null, 2));
  return metadata;
}
