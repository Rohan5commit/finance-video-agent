import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';

const VOICE = 'en-US-AnaNeural';
const OUT_DIR = path.resolve(process.cwd(), 'out');

// Generate audio for a single text segment
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

  // Generate full narration audio from all spokenText
  let fullText = '';
  for (const scene of script.scenes) {
    if (scene.spokenText) {
      fullText += scene.spokenText + ' ';
    }
  }

  // Split into chunks of ~1000 chars to avoid edge-tts limits
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
      console.log(`    Saved: ${audioPath}`);
    } catch (err) {
      console.error(`  TTS failed for chunk ${i}:`, err.message);
    }
    // Small delay between chunks
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`TTS complete: ${audioFiles.length} audio files generated`);
  return audioFiles;
}

// Write a metadata file mapping scenes to their audio start times
export function writeAudioMetadata(script, audioFiles, outputDir = OUT_DIR) {
  const totalChars = script.scenes.reduce((sum, s) => sum + (s.spokenText?.length || 0), 0);
  const estimatedDurationMs = totalChars * 55; // rough: ~55ms per char for speech

  // Estimate start times per scene based on text position
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
    estimatedTotalDurationMs: estimatedDurationMs,
    sceneTimings,
    generatedAt: new Date().toISOString()
  };

  const metaPath = path.join(outputDir, 'audio_metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  console.log(`Audio metadata written to ${metaPath}`);
  return metadata;
}
