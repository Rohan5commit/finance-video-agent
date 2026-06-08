import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';
import { Voiceover } from '../components/Voiceover.jsx';
import { Chart } from '../components/Chart.jsx';

export const NewsSection = ({ scene }) => {
  const frame = useCurrentFrame();
  
  const keyFactSlide = interpolate(frame, [90, 110], [-400, 0], { extrapolateRight: 'clamp' });
  const lines = scene.spokenText ? scene.spokenText.split('. ').filter(Boolean) : [];

  return (
    <AbsoluteFill>
      <Background />
      
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 120,
          width: 1100,
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
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {lines.map((line, i) => {
            const lineFrame = i * 60;
            const opacity = interpolate(frame, [lineFrame, lineFrame + 15], [0, 1], { extrapolateRight: 'clamp' });
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

      {scene.keyFact && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            right: 0,
            width: 500,
            background: '#f5a623',
            padding: '30px 40px',
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            transform: `translateX(${keyFactSlide}px)`,
          }}
        >
          <p
            style={{
              color: '#0a0e1a',
              fontSize: 22,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {scene.keyFact}
          </p>
        </div>
      )}

      {scene.ticker && scene.ticker !== 'null' && (
        <div
          style={{
            position: 'absolute',
            top: 650,
            right: 120,
          }}
        >
          <Chart
            data={[
              { label: 'D1', value: 100 },
              { label: 'D2', value: 112 },
              { label: 'D3', value: 108 },
              { label: 'D4', value: 125 },
              { label: 'D5', value: 118 },
            ]}
            startFrame={frame}
          />
        </div>
      )}

      {scene.spokenText && <Voiceover text={scene.spokenText} startFrame={0} />}
    </AbsoluteFill>
  );
};
