import React from 'react';
import { AbsoluteFill, Sequence, Composition } from 'remotion';
import { Intro } from './compositions/Intro.jsx';
import { NewsSection } from './compositions/NewsSection.jsx';
import { Explainer } from './compositions/Explainer.jsx';
import { MarketSnapshot } from './compositions/MarketSnapshot.jsx';
import { Outro } from './compositions/Outro.jsx';

const FinanceVideo = ({ script: s }) => {
  let frame = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0e1a' }}>
      {(s.scenes || []).map((scene) => {
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

export const RemotionRoot = ({ script }) => {
  if (!script || !script.scenes || !Array.isArray(script.scenes) || script.scenes.length === 0) {
    throw new Error('script prop is missing or has no scenes');
  }

  const TotalFrames = script.scenes.reduce(
    (sum, s) => sum + (s.durationSeconds || 30) * 30, 0
  );

  return (
    <Composition
      id="FinanceVideo"
      component={FinanceVideo}
      durationInFrames={TotalFrames}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ script }}
    />
  );
};

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
