import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

export const Chart = ({ data = [], startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = 50;
  const chartWidth = data.length * (barWidth + 20);

  return (
    <svg width={chartWidth} height={240} viewBox={`0 0 ${chartWidth} 240`}>
      {data.map((d, i) => {
        const barFrame = startFrame + i * 5;
        const heightProgress = interpolate(frame, [barFrame, barFrame + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const barHeight = (d.value / maxVal) * 180;
        const x = i * (barWidth + 20);
        const y = 200 - barHeight * heightProgress;
        
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight * heightProgress}
              fill="#00d4ff"
              opacity={0.8}
              rx={4}
            />
            <text
              x={x + barWidth / 2}
              y={220}
              textAnchor="middle"
              fill="#8892b0"
              fontSize={12}
              fontFamily="Arial, sans-serif"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
