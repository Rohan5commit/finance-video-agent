import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';
import { Voiceover } from '../components/Voiceover.jsx';
import { Chart } from '../components/Chart.jsx';

export const NewsSection = ({ scene }) => {
  const frame = useCurrentFrame();
  
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleSlide = interpolate(frame, [0, 20], [-30, 0], { extrapolateRight: 'clamp' });
  const factSlide = interpolate(frame, [30, 55], [600, 0], { extrapolateRight: 'clamp' });
  const factOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: 'clamp' });
  const chartOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Background />

      {scene.spokenText && <Voiceover text={scene.spokenText} startFrame={0} />}

      {/* Scene label */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 120,
          opacity: titleOpacity,
        }}
      >
        <span
          style={{
            color: '#f5a623',
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {scene.ticker && scene.ticker !== 'null' ? scene.ticker : 'STORY'}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 120,
          right: 120,
          opacity: titleOpacity,
          transform: `translateY(${titleSlide}px)`,
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: 52,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {scene.title}
        </h1>
      </div>

      {/* Key fact panel */}
      {scene.keyFact && (
        <div
          style={{
            position: 'absolute',
            top: 340,
            left: 120,
            right: 120,
            background: 'rgba(245, 166, 35, 0.12)',
            border: '1px solid rgba(245, 166, 35, 0.3)',
            borderRadius: 12,
            padding: '28px 36px',
            opacity: factOpacity,
            transform: `translateX(${factSlide}px)`,
          }}
        >
          <span
            style={{
              color: '#f5a623',
              fontSize: 14,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 10,
            }}
          >
            KEY FACT
          </span>
          <p
            style={{
              color: '#ffffff',
              fontSize: 28,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {scene.keyFact}
          </p>
        </div>
      )}

      {/* Chart */}
      {scene.chartData && scene.chartData.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 140,
            right: 120,
            opacity: chartOpacity,
          }}
        >
          <Chart data={scene.chartData} startFrame={Math.max(0, frame - 60)} />
        </div>
      )}

      {/* Ticker badge */}
      {scene.ticker && scene.ticker !== 'null' && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 120,
            opacity: chartOpacity,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: 8,
              padding: '8px 18px',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#00d4ff',
              }}
            />
            <span
              style={{
                color: '#00d4ff',
                fontSize: 18,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 700,
              }}
            >
              {scene.ticker}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
