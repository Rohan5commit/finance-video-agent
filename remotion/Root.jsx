import React from 'react';
import { AbsoluteFill, Sequence, Composition } from 'remotion';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Intro } from './compositions/Intro.jsx';
import { NewsSection } from './compositions/NewsSection.jsx';
import { Explainer } from './compositions/Explainer.jsx';
import { MarketSnapshot } from './compositions/MarketSnapshot.jsx';
import { Outro } from './compositions/Outro.jsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let script;
try {
  script = JSON.parse(fs.readFileSync(path.join(__dirname, 'script.json'), 'utf-8'));
} catch {
  throw new Error('script.json not found. Run `npm run agent` first to generate it.');
}

if (!script.scenes || !Array.isArray(script.scenes) || script.scenes.length === 0) {
  throw new Error('script.json is missing "scenes" array or it is empty.');
}

const TotalFrames = script.scenes.reduce(
  (sum, s) => sum + (s.durationSeconds || 30) * 30, 0
);

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
