import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';

const AssetPanel = ({ asset, index }) => {
  const frame = useCurrentFrame();
  const panelStartFrame = index * 12;
  const opacity = interpolate(frame, [panelStartFrame, panelStartFrame + 18], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [panelStartFrame, panelStartFrame + 18], [0.95, 1], { extrapolateRight: 'clamp' });
  
  const isPositive = asset.positive === true;
  const isNegative = asset.positive === false;
  const changeColor = isPositive ? '#00c853' : isNegative ? '#ff3d00' : '#8892b0';
  const arrow = isPositive ? '▲' : isNegative ? '▼' : '';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `1px solid ${isPositive ? 'rgba(0,200,83,0.2)' : isNegative ? 'rgba(255,61,0,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12,
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity,
        transform: `scale(${scale})`,
        background: isPositive
          ? 'rgba(0, 200, 83, 0.06)'
          : isNegative
          ? 'rgba(255, 61, 0, 0.06)'
          : 'rgba(17, 24, 39, 0.6)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              color: '#ffffff',
              fontSize: 22,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {asset.name || 'Unknown'}
          </div>
          <div
            style={{
              color: '#8892b0',
              fontSize: 15,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400,
            }}
          >
            {asset.ticker || ''}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isPositive ? 'rgba(0,200,83,0.15)' : isNegative ? 'rgba(255,61,0,0.15)' : 'rgba(136,146,176,0.15)',
            borderRadius: 6,
            padding: '4px 10px',
          }}
        >
          <span style={{ color: changeColor, fontSize: 14 }}>{arrow}</span>
          <span
            style={{
              color: changeColor,
              fontSize: 16,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 700,
            }}
          >
            {asset.change}
          </span>
        </div>
      </div>

      <div>
        <div
          style={{
            color: '#f5a623',
            fontSize: 44,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          {asset.value}
        </div>
      </div>
    </div>
  );
};

export const MarketSnapshot = ({ scene }) => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const assets = (scene.assets || []).slice(0, 6);

  return (
    <AbsoluteFill>
      <Background />

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 120,
          opacity: headerOpacity,
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
          MARKET SNAPSHOT
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 120,
          opacity: headerOpacity,
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: 42,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 800,
            margin: 0,
          }}
        >
          {scene.title || "Today's Markets"}
        </h1>
      </div>

      {/* Asset grid */}
      <div
        style={{
          position: 'absolute',
          top: 220,
          left: 80,
          right: 80,
          bottom: 40,
          display: 'grid',
          gridTemplateColumns: assets.length <= 4 ? '1fr 1fr' : '1fr 1fr 1fr',
          gridTemplateRows: assets.length <= 4 ? '1fr 1fr' : '1fr 1fr',
          gap: 16,
        }}
      >
        {assets.map((asset, i) => (
          <AssetPanel key={i} asset={asset} index={i} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
