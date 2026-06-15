import React from 'react';
import { AbsoluteFill, Sequence, Composition } from 'remotion';
import { Intro } from './compositions/Intro.jsx';
import { NewsSection } from './compositions/NewsSection.jsx';
import { Explainer } from './compositions/Explainer.jsx';
import { MarketSnapshot } from './compositions/MarketSnapshot.jsx';
import { Outro } from './compositions/Outro.jsx';

const FinanceVideo = ({ script }) => {
  if (!script || !script.scenes) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ff4444', fontSize: 48 }}>No script data</div>
      </AbsoluteFill>
    );
  }

  let frame = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0e1a' }}>
      {(script.scenes || []).map((scene) => {
        const durationInFrames = (scene.durationSeconds || 30) * 30;
        const from = frame;
        frame += durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames}>
            <SceneComponent scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => (
  <Composition
    id="FinanceVideo"
    component={FinanceVideo}
    durationInFrames={30 * 60}
    fps={30}
    width={1920}
    height={1080}
  />
);

const SceneComponent = ({ scene }) => {
  switch (scene.type) {
    case 'intro':
      return <Intro scene={scene} />;
    case 'news':
      return <NewsSection scene={scene} />;
    case 'explainer':
      return <Explainer scene={scene} />;
    case 'market':
      return <MarketSnapshot scene={scene} />;
    case 'outro':
      return <Outro scene={scene} />;
    default:
      return <Intro scene={scene} />;
  }
};
