import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const Background = () => {
  const frame = useCurrentFrame();
  
  // Slow sweeping gradient
  const gradientX = interpolate(frame, [0, 600], [-200, 200], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0a0e1a' }}>
      {/* Grid overlay */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {/* Vertical lines */}
        {Array.from({ length: 25 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * 80}
            y1={0}
            x2={i * 80}
            y2={1080}
            stroke="white"
            strokeWidth="0.5"
            opacity={0.04}
          />
        ))}
        {/* Horizontal lines */}
        {Array.from({ length: 14 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 80}
            x2={1920}
            y2={i * 80}
            stroke="white"
            strokeWidth="0.5"
            opacity={0.04}
          />
        ))}
      </svg>

      {/* Sweeping radial gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.3,
          background: `radial-gradient(circle at ${50 + gradientX}% 50%, rgba(0, 212, 255, 0.15), transparent 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};
