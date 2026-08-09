import { useCurrentFrame, interpolate } from 'remotion';

export const AnimatedText = ({ text = '', startFrame = 0, style = {} }) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');

  return (
    <span style={style}>
      {words.map((word, i) => {
        const wordStartFrame = startFrame + i * 4;
        const opacity = interpolate(frame, [wordStartFrame, wordStartFrame + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const translateY = interpolate(frame, [wordStartFrame, wordStartFrame + 8], [8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity,
              transform: `translateY(${translateY}px)`,
              marginRight: '0.3em',
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};
