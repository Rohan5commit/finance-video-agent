import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';

export const Explainer = ({ scene }) => {
  const frame = useCurrentFrame();
  
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleSlide = interpolate(frame, [0, 20], [-30, 0], { extrapolateRight: 'clamp' });

  const bullets = scene.bullets || [];

  return (
    <AbsoluteFill>
      <Background />

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
            color: '#00d4ff',
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          EXPLAINER
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
            fontSize: 48,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {scene.title}
        </h1>
      </div>

      {/* Divider line */}
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 120,
          width: interpolate(frame, [20, 50], [0, 400], { extrapolateRight: 'clamp' }),
          height: 3,
          background: 'linear-gradient(90deg, #00d4ff, transparent)',
          borderRadius: 2,
        }}
      />

      {/* Bullets - primary visual content */}
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 120,
          right: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {bullets.map((bullet, i) => {
          const bulletFrame = 30 + i * 30;
          const opacity = interpolate(frame, [bulletFrame, bulletFrame + 15], [0, 1], { extrapolateRight: 'clamp' });
          const xOffset = interpolate(frame, [bulletFrame, bulletFrame + 15], [-20, 0], { extrapolateRight: 'clamp' });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 18,
                opacity,
                transform: `translateX(${xOffset}px)`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(0, 212, 255, 0.15)',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    color: '#00d4ff',
                    fontSize: 16,
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </span>
              </div>
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
    </AbsoluteFill>
  );
};
