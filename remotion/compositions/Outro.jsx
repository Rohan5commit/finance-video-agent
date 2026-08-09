import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';

export const Outro = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleScale = interpolate(frame, [0, 20], [0.9, 1], { extrapolateRight: 'clamp' });

  const bullets = (scene.summaryBullets || []).slice(0, 3);
  const totalDuration = durationInFrames;

  return (
    <AbsoluteFill>
      <Background />

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
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            textAlign: 'center',
            marginBottom: 50,
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

        {bullets.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              textAlign: 'center',
              maxWidth: 900,
            }}
          >
            {bullets.map((bullet, i) => {
              const bulletFrame = totalDuration - 120 + i * 25;
              const opacity = interpolate(frame, [bulletFrame, bulletFrame + 15], [0, 1], { extrapolateRight: 'clamp' });
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
                    padding: '10px 18px',
                    maxWidth: 350,
                    margin: '0 auto',
                  }}
                >
                  <span style={{ color: '#00d4ff', fontSize: 16, flexShrink: 0 }}>◆</span>
                  <span
                    style={{
                      color: '#e6f1ff',
                      fontSize: 16,
                      fontFamily: 'Arial, sans-serif',
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {bullet}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>

      <svg
        style={{
          position: 'absolute',
          bottom: 40,
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
