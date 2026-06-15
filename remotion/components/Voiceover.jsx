import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

export const Voiceover = ({ text, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  const sentences = text
    .replace(/\.\s+/g, '.|')
    .replace(/\?\s+/g, '?|')
    .replace(/!\s+/g, '!|')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return null;

  const framesPerSentence = Math.max(60, Math.floor((30 * 40) / sentences.length));
  const currentIndex = Math.min(
    Math.floor((frame - startFrame) / framesPerSentence),
    sentences.length - 1
  );
  const safeIndex = Math.max(0, currentIndex);
  const sentenceStart = startFrame + safeIndex * framesPerSentence;
  const sentenceOpacity = interpolate(
    frame,
    [sentenceStart, sentenceStart + 10, sentenceStart + framesPerSentence - 10, sentenceStart + framesPerSentence],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 80,
        right: 80,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          borderRadius: 12,
          padding: '12px 28px',
          maxWidth: '75%',
          opacity: sentenceOpacity,
          borderLeft: '3px solid #f5a623',
        }}
      >
        <span
          style={{
            color: '#e6f1ff',
            fontSize: 22,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          {sentences[safeIndex]}
        </span>
      </div>
    </div>
  );
};
