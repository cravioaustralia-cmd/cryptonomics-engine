import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Background} from '../components/scenery';
import {Problem} from './Problem';
import {CheckWipe, World, camAt} from './World';
import {Finale} from './Finale';

/**
 * Hero cut, 16:9. All timing comes from src/timing/hero.json (built by
 * tools/build_timing.py from the recorded VO); audio is mixed separately by
 * tools/mix_audio.py from the same file and muxed after render.
 */
export const Hero: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const inWorld = t >= 20.95 && t < 65.05;
  const cam = inWorld ? camAt(t) : {x: 0, y: 0};
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Background w={1920} h={1080} camX={cam.x} camY={cam.y} />
      {t < 21.05 ? <Problem t={t} /> : null}
      {inWorld ? <World t={t} /> : null}
      <Finale t={t} />
      <CheckWipe t={t} />
    </AbsoluteFill>
  );
};
