import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Background } from '../components/Background.jsx';
import { Voiceover } from '../components/Voiceover.jsx';

const AssetPanel = ({ asset, index }) => {
  const frame = useCurrentFrame();
  const panelStartFrame = index * 15;
  const opacity = interpolate(frame, [panelStartFrame, panelStartFrame + 20], [0, 1], { extrapolateRight: 'clamp' });
  
  return (
    <div
      style={{
        width: 880,
        height: 440,
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity,
        background: 'rgba(17, 24, 39, 0.6)',
      }}
    >
      <div>
        <span
          style={{
            color: '#ffffff',
            fontSize: 28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 600,
          }}
        >
          {asset.name}
        </span>
        <span
          style={{
            color: '#8892b0',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 400,
            marginLeft: 12,
          }}
        >
          {asset.ticker}
        </span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          color: '#f5a623',
          fontSize: 56,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 800,
        }}>
          {asset.value}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            color: asset.positive ? '#00c853' : '#ff3d00',
            fontSize: 28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
          }}
        >
          {asset.change}
        </span>
      </div>
    </div>
  );
};

export const MarketSnapshot = ({ scene }) => {
  return (
    <AbsoluteFill>
      <Background />
      
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 80,
          right: 80,
          bottom: 80,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 20,
        }}
      >
        {(scene.assets || []).map((asset, i) => (
          <AssetPanel key={i} asset={asset} index={i} />
        ))}
      </div>

      {scene.spokenText && <Voiceover text={scene.spokenText} startFrame={0} />}
    </AbsoluteFill>
  );
};
