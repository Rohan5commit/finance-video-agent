#!/usr/bin/env python3
"""Kokoro TTS - generates audio from text files using the Kokoro model."""
import sys
import os
import json
import glob

def main():
    if len(sys.argv) < 3:
        print("Usage: kokoro_tts.py <input_dir> <output_dir> [voice]")
        sys.exit(1)

    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "am_michael"

    os.makedirs(output_dir, exist_ok=True)

    # Find all text chunk files
    text_files = sorted(glob.glob(os.path.join(input_dir, "chunk_*.txt")))
    if not text_files:
        print("No chunk_*.txt files found in", input_dir)
        sys.exit(1)

    print(f"Found {len(text_files)} text chunks, voice={voice}")

    try:
        from kokoro import KPipeline
        import soundfile as sf
        import numpy as np
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Install with: pip install kokoro soundfile numpy")
        sys.exit(1)

    pipeline = KPipeline(lang_code='a')

    audio_files = []
    for idx, text_file in enumerate(text_files):
        with open(text_file, 'r') as f:
            text = f.read().strip()

        if not text:
            print(f"  Skipping empty chunk {idx}")
            continue

        print(f"  Generating chunk {idx + 1}/{len(text_files)} ({len(text)} chars)...")

        try:
            # Generate audio segments and concatenate
            all_audio = []
            for gs, ps, audio in pipeline(text, voice=voice, speed=1.5):
                all_audio.append(audio)

            if not all_audio:
                print(f"    WARNING: No audio generated for chunk {idx}")
                continue

            # Concatenate all segments
            full_audio = np.concatenate(all_audio)

            # Save as WAV
            wav_path = os.path.join(output_dir, f"narration_{idx}.wav")
            sf.write(wav_path, full_audio, 24000)
            size_kb = os.path.getsize(wav_path) / 1024
            duration_s = len(full_audio) / 24000
            print(f"    ✓ {wav_path} ({size_kb:.0f}KB, {duration_s:.1f}s)")
            audio_files.append(wav_path)
        except Exception as e:
            print(f"    ERROR: Chunk {idx} failed: {e}")
            continue

    # Write manifest
    manifest = {
        "voice": voice,
        "audio_files": audio_files,
        "count": len(audio_files)
    }
    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"\nKokoro TTS complete: {len(audio_files)}/{len(text_files)} chunks generated")
    print(f"Manifest: {manifest_path}")

if __name__ == "__main__":
    main()
