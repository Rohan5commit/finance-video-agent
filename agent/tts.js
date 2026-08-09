import { execFileSync } from 'child_process';
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
  const chunks = splitIntoChunks(fullText, 1500);
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
    execFileSync(
      'python3', [kokoroScript, chunkDir, audioOutDir, VOICE],
      { stdio: 'inherit', timeout: 1200000 }
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

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    throw new Error('Kokoro TTS manifest is corrupt or incomplete');
  }
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
      execFileSync(
        'ffmpeg', ['-i', wavPath, '-codec:a', 'libmp3lame', '-q:a', '2', mp3Path, '-y'],
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

  if (audioFiles.length < wavFiles.length * 0.8) {
    throw new Error(`Too many audio conversion failures (${wavFiles.length - audioFiles.length}/${wavFiles.length} failed)`);
  }

  // Clean up temp text chunks
  try { fs.rmSync(chunkDir, { recursive: true }); } catch {}

  return audioFiles;
}

// Merge audio files into a single narration track
export function mergeAudioFiles(audioFiles) {
  if (audioFiles.length === 0) {
    console.error('No audio files to merge');
    return null;
  }

  const mergedPath = path.join(OUT_DIR, 'narration.mp3');

  if (audioFiles.length === 1) {
    fs.copyFileSync(audioFiles[0], mergedPath);
    console.log('Single audio file, copied as narration.mp3');
    return mergedPath;
  }

  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe', timeout: 5000 });
  } catch {
    console.error('ffmpeg not found! Audio merge requires ffmpeg.');
    return null;
  }

  // Escape single quotes in file paths for ffmpeg concat demuxer
  const concatList = audioFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
  const listPath = path.join(OUT_DIR, 'concat_list.txt');
  fs.writeFileSync(listPath, concatList);

  console.log('Merging audio files with ffmpeg...');
  try {
    execFileSync(
      'ffmpeg', ['-f', 'concat', '-safe', '0', '-i', listPath, '-c:a', 'libmp3lame', '-q:a', '2', mergedPath, '-y'],
      { stdio: 'pipe', timeout: 30000 }
    );
    console.log(`Audio merged: ${mergedPath}`);
    return mergedPath;
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    console.error('ffmpeg merge failed:', stderr || err.message);
    return null;
  }
}

// Get duration of a media file in seconds using ffprobe
function getMediaDuration(filePath) {
  try {
    const result = execFileSync(
      'ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', filePath],
      { stdio: 'pipe', timeout: 10000 }
    ).toString().trim();
    const duration = parseFloat(result);
    if (isNaN(duration) || duration <= 0) {
      console.warn(`Warning: Could not get duration for ${filePath}`);
      return 0;
    }
    return duration;
  } catch (err) {
    console.warn(`Warning: ffprobe failed for ${filePath}: ${err.message}`);
    return 0;
  }
}

// Merge audio into video using ffmpeg, padding audio with silence if shorter
export function mergeAudioWithVideo(videoPath, audioPath, outputPath) {
  if (!fs.existsSync(audioPath)) {
    console.log('No audio to merge, keeping video as-is');
    return videoPath;
  }

  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe', timeout: 5000 });
  } catch {
    console.error('ffmpeg not found! Video-audio merge requires ffmpeg.');
    return videoPath;
  }

  const videoDuration = getMediaDuration(videoPath);
  const audioDuration = getMediaDuration(audioPath);
  if (videoDuration === 0 || audioDuration === 0) {
    console.error('Cannot merge: unable to determine media durations');
    return videoPath;
  }
  console.log(`  Video duration: ${videoDuration.toFixed(1)}s, Audio duration: ${audioDuration.toFixed(1)}s`);

  console.log('Merging audio into video with ffmpeg...');
  try {
    if (audioDuration < videoDuration) {
      console.log(`  Audio is ${(videoDuration - audioDuration).toFixed(1)}s shorter than video — padding with silence`);
      execFileSync(
        'ffmpeg', [
          '-i', videoPath, '-i', audioPath,
          '-filter_complex', `[1:a]apad=whole_dur=${videoDuration.toFixed(3)}[padded]`,
          '-map', '0:v:0', '-map', '[padded]', '-c:v', 'copy', '-c:a', 'aac', '-t', videoDuration.toFixed(3), outputPath, '-y'
        ],
        { stdio: 'pipe', timeout: 120000 }
      );
    } else {
      if (audioDuration > videoDuration) {
        console.log(`  Audio is ${(audioDuration - videoDuration).toFixed(1)}s longer than video — trimming to match`);
      }
      execFileSync(
        'ffmpeg', [
          '-i', videoPath, '-i', audioPath, '-c:v', 'copy', '-c:a', 'aac',
          '-map', '0:v:0', '-map', '1:a:0', '-shortest', outputPath, '-y'
        ],
        { stdio: 'pipe', timeout: 120000 }
      );
    }
    console.log(`Video with audio: ${outputPath}`);
    return outputPath;
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    console.error('Audio-video merge failed:', stderr || err.message);
    return videoPath;
  }
}

export function writeAudioMetadata(script, audioFiles, outputDir = OUT_DIR) {
  // Use ffprobe to get actual audio duration instead of character-based estimation
  let estimatedDurationMs = 0;
  try {
    const totalDuration = audioFiles.reduce((sum, f) => {
      const dur = getMediaDuration(f);
      return sum + (dur > 0 ? dur : 0);
    }, 0);
    estimatedDurationMs = totalDuration * 1000;
  } catch {
    // Fallback to character-based estimate
    const totalChars = script.scenes.reduce((sum, s) => sum + (s.spokenText?.length || 0), 0);
    estimatedDurationMs = totalChars * 55;
  }

  let charOffset = 0;
  const totalChars = script.scenes.reduce((sum, s) => sum + (s.spokenText?.length || 0), 0);
  const sceneTimings = script.scenes.map(scene => {
    const length = scene.spokenText?.length || 0;
    const startMs = totalChars > 0 ? (charOffset / totalChars) * estimatedDurationMs : 0;
    const durationMs = totalChars > 0 ? (length / totalChars) * estimatedDurationMs : 0;
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
