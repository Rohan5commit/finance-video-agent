import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

export const Voiceover = ({ text, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          borderRadius: 24,
          padding: '10px 32px',
          maxWidth: '80%',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
