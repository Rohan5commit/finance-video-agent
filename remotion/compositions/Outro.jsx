import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';

export const Outro = ({ scene }) => {
  const frame = useCurrentFrame();
  
  const textOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Background />
      
      {/* Main spoken text */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 200,
          right: 200,
          textAlign: 'center',
          opacity: textOpacity,
        }}
      >
        <p
          style={{
            color: '#ffffff',
            fontSize: 32,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 500,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {scene.spokenText}
        </p>
      </div>

      {/* Summary bullets */}
      <div
        style={{
          position: 'absolute',
          top: 520,
          left: 200,
          right: 200,
        }}
      >
        {(scene.summaryBullets || []).map((bullet, i) => {
          const bulletFrame = 30 + i * 25;
          const opacity = interpolate(frame, [bulletFrame, bulletFrame + 12], [0, 1], { extrapolateRight: 'clamp' });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 16,
                opacity,
              }}
            >
              <span style={{ color: '#00d4ff', fontSize: 20 }}>◆</span>
              <span
                style={{
                  color: '#ccd6f6',
                  fontSize: 22,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 400,
                }}
              >
                {bullet}
              </span>
            </div>
          );
        })}
      </div>

      {/* Animated waveform */}
      <svg
        style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        width="300"
        height="40"
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const barHeight = Math.sin(frame * 0.1 + i * 0.8) * 15 + 20;
          return (
            <rect
              key={i}
              x={i * 65 + 10}
              y={40 - barHeight}
              width="40"
              height={barHeight}
              fill="#00d4ff"
              opacity={0.5}
              rx="4"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
