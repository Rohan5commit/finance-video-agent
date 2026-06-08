import React from 'react';
import { AbsoluteFill, Sequence, Composition } from 'remotion';
import script from './script.json' assert { type: 'json' };
import { Intro } from './compositions/Intro.jsx';
import { NewsSection } from './compositions/NewsSection.jsx';
import { Explainer } from './compositions/Explainer.jsx';
import { MarketSnapshot } from './compositions/MarketSnapshot.jsx';
import { Outro } from './compositions/Outro.jsx';
import { Background } from './components/Background.jsx';

const TotalFrames = script.scenes.reduce((sum, s) => sum + s.durationSeconds * 30, 0);

export const Root = () => (
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

const FinanceVideo = ({ script: s }) => {
  let frame = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0e1a' }}>
      <Background />
      {s.scenes.map((scene) => {
        const durationInFrames = scene.durationSeconds * 30;
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
