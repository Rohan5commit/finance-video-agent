import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

export const Ticker = ({ items = [] }) => {
  const frame = useCurrentFrame();
  const tickerText = items.join('  ·  ');
  const textWidth = tickerText.length * 8;
  const speed = 2;
  const translateX = interpolate(
    frame * speed % (textWidth + 1920),
    [0, textWidth + 1920],
    [1920, -textWidth],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 36,
        background: '#111827',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          whiteSpace: 'nowrap',
          color: '#f5a623',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          transform: `translateX(${translateX}px)`,
        }}
      >
        {tickerText}
      </div>
    </div>
  );
};
