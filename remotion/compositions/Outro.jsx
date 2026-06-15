import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';

export const Outro = ({ scene }) => {
  const frame = useCurrentFrame();
  
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleScale = interpolate(frame, [0, 20], [0.9, 1], { extrapolateRight: 'clamp' });

  const spokenLines = scene.spokenText
    ? scene.spokenText
        .replace(/\.\s+/g, '.|')
        .replace(/\?\s+/g, '?|')
        .replace(/!\s+/g, '!|')
        .split('|')
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  return (
    <AbsoluteFill>
      <Background />

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 200px',
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          <h1
            style={{
              color: '#ffffff',
              fontSize: 52,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {scene.title || 'Finance Brief'}
          </h1>
        </div>

        {/* Spoken text - sentence by sentence */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          {spokenLines.map((line, i) => {
            const lineFrame = 20 + i * 40;
            const opacity = interpolate(frame, [lineFrame, lineFrame + 15], [0, 1], { extrapolateRight: 'clamp' });
            const y = interpolate(frame, [lineFrame, lineFrame + 15], [10, 0], { extrapolateRight: 'clamp' });
            return (
              <p
                key={i}
                style={{
                  color: '#ccd6f6',
                  fontSize: 24,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  margin: 0,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                {line}
              </p>
            );
          })}
        </div>
      </div>

      {/* Summary bullets */}
      {scene.summaryBullets && scene.summaryBullets.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 160,
            left: 200,
            right: 200,
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
          }}
        >
          {scene.summaryBullets.map((bullet, i) => {
            const bulletFrame = 60 + i * 25;
            const opacity = interpolate(frame, [bulletFrame, bulletFrame + 12], [0, 1], { extrapolateRight: 'clamp' });
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity,
                  background: 'rgba(0, 212, 255, 0.08)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 8,
                  padding: '10px 20px',
                }}
              >
                <span style={{ color: '#00d4ff', fontSize: 16 }}>◆</span>
                <span
                  style={{
                    color: '#e6f1ff',
                    fontSize: 18,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  {bullet}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom waveform */}
      <svg
        style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        width="200"
        height="30"
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const barHeight = Math.sin(frame * 0.1 + i * 0.8) * 10 + 15;
          return (
            <rect
              key={i}
              x={i * 42 + 5}
              y={30 - barHeight}
              width="30"
              height={barHeight}
              fill="#00d4ff"
              opacity={0.4}
              rx="3"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
