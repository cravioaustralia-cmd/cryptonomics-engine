import React from 'react';
import {Composition, continueRender, delayRender} from 'remotion';
import {Hero} from './hero/Hero';
import {Social} from './social/Social';
import {HERO, SOCIAL} from './timing';
import {fontsReady} from './fonts';

const handle = delayRender('fonts');
fontsReady.then(() => continueRender(handle));

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Hero" component={Hero} durationInFrames={HERO.durationInFrames} fps={30} width={1920} height={1080} />
    <Composition id="Social" component={Social} durationInFrames={SOCIAL.durationInFrames} fps={30} width={1080} height={1920} />
  </>
);
