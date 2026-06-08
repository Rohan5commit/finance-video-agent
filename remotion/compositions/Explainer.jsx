import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';
import { Voiceover } from '../components/Voiceover.jsx';

export const Explainer = ({ scene }) => {
  const frame = useCurrentFrame();
  
  const lines = scene.spokenText ? scene.spokenText.split('. ').filter(Boolean) : [];

  return (
    <AbsoluteFill>
      <Background />
      
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 120,
          width: 800,
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: 42,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
            margin: 0,
            marginBottom: 40,
            lineHeight: 1.2,
          }}
        >
          {scene.title}
        </h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {lines.map((line, i) => {
            const opacity = interpolate(frame, [i * 10, i * 10 + 15], [0, 1], { extrapolateRight: 'clamp' });
            return (
              <p
                key={i}
                style={{
                  color: '#ccd6f6',
                  fontSize: 24,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  margin: 0,
                  opacity,
                }}
              >
                {line}.
              </p>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 120,
          right: 120,
          width: 700,
        }}
      >
        {(scene.bullets || []).map((bullet, i) => {
          const bulletFrame = i * 40;
          const opacity = interpolate(frame, [bulletFrame, bulletFrame + 15], [0, 1], { extrapolateRight: 'clamp' });
          const xOffset = interpolate(frame, [bulletFrame, bulletFrame + 15], [-20, 0], { extrapolateRight: 'clamp' });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                marginBottom: 28,
                opacity,
                transform: `translateX(${xOffset}px)`,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" style={{ marginTop: 6, flexShrink: 0 }}>
                <polygon points="0,10 15,3 15,17" fill="#00d4ff" />
              </svg>
              <span
                style={{
                  color: '#e6f1ff',
                  fontSize: 26,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {bullet}
              </span>
            </div>
          );
        })}
      </div>

      {scene.spokenText && <Voiceover text={scene.spokenText} startFrame={0} />}
    </AbsoluteFill>
  );
};
