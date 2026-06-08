import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';
import { AnimatedText } from '../components/AnimatedText.jsx';
import { Voiceover } from '../components/Voiceover.jsx';

export const Intro = ({ scene }) => {
  const frame = useCurrentFrame();
  
  const lineProgress = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const channelOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });
  const channelScale = interpolate(frame, [20, 35], [0.95, 1], { extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Background />
      
      {/* Animated line drawing */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <line
          x1="0"
          y1="80"
          x2="1920"
          y2="80"
          stroke="#00d4ff"
          strokeWidth="1"
          strokeDasharray="1920"
          strokeDashoffset={1920 * (1 - lineProgress)}
          opacity={0.6}
        />
      </svg>

      {/* Channel name */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: channelOpacity,
          transform: `scale(${channelScale})`,
        }}
      >
        <span
          style={{
            color: '#f5a623',
            fontSize: 28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          Finance Brief
        </span>
      </div>

      {/* Headline - word by word */}
      <div
        style={{
          position: 'absolute',
          top: 340,
          left: 120,
          right: 120,
          textAlign: 'center',
        }}
      >
        {scene.headline && (
          <AnimatedText
            text={scene.headline}
            startFrame={40}
            fps={30}
            style={{
              color: '#ffffff',
              fontSize: 64,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          />
        )}
      </div>

      {/* Subheadline */}
      <div
        style={{
          position: 'absolute',
          top: 520,
          left: 200,
          right: 200,
          textAlign: 'center',
          opacity: subOpacity,
        }}
      >
        <span
          style={{
            color: '#8892b0',
            fontSize: 28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          {scene.subheadline}
        </span>
      </div>

      {/* Subtitle */}
      {scene.spokenText && <Voiceover text={scene.spokenText} startFrame={0} />}
    </AbsoluteFill>
  );
};
