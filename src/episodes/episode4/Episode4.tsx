import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { Background } from "../shared/Background";
import { ProgressBar } from "../shared/ProgressBar";
import { Captions } from "../shared/Captions";
import { getSceneTimings } from "../shared/timing";
import { buildSpeechBlocks, getMusicVolume } from "../shared/musicVolume";
import type { EpisodeCaptionWord } from "../shared/captionTypes";
import { buildSfxEvents } from "./sfxCues";

import { Scene01Queue } from "./scenes/Scene01Queue";
import { Scene02Scale } from "./scenes/Scene02Scale";
import { Scene03Title } from "./scenes/Scene03Title";
import { Scene04Y2010 } from "./scenes/Scene04Y2010";
import { Scene05Curious } from "./scenes/Scene05Curious";
import { Scene06Order } from "./scenes/Scene06Order";
import { Scene07Receipt } from "./scenes/Scene07Receipt";
import { Scene08Today } from "./scenes/Scene08Today";
import { Scene09Phones } from "./scenes/Scene09Phones";
import { Scene10Ferrari } from "./scenes/Scene10Ferrari";
import { Scene11PizzaDay } from "./scenes/Scene11PizzaDay";
import { Scene12Pause } from "./scenes/Scene12Pause";
import { Scene13Rollercoaster } from "./scenes/Scene13Rollercoaster";
import { Scene14Blockchain } from "./scenes/Scene14Blockchain";
import { Scene15CTA } from "./scenes/Scene15CTA";
import type { SceneProps } from "./scenes/types";

import captionsData from "../episode4.captions.json";
import meta from "../episode4.meta.json";

const SCENE_COMPONENTS: Record<string, React.FC<SceneProps>> = {
  "scene01-queue": Scene01Queue,
  "scene02-scale": Scene02Scale,
  "scene03-title": Scene03Title,
  "scene04-2010": Scene04Y2010,
  "scene05-curious": Scene05Curious,
  "scene06-order": Scene06Order,
  "scene07-receipt": Scene07Receipt,
  "scene08-today": Scene08Today,
  "scene09-phones": Scene09Phones,
  "scene10-ferrari": Scene10Ferrari,
  "scene11-pizzaday": Scene11PizzaDay,
  "scene12-pause": Scene12Pause,
  "scene13-rollercoaster": Scene13Rollercoaster,
  "scene14-blockchain": Scene14Blockchain,
  "scene15-cta": Scene15CTA,
};

const SFX_DURATION_FRAMES = 45;

export const Episode4: React.FC = () => {
  const { fps } = useVideoConfig();
  const words = captionsData as EpisodeCaptionWord[];
  const totalDurationMs = meta.voiceoverDurationMs + meta.outroMs;

  const scenes = useMemo(
    () => getSceneTimings(words, totalDurationMs, fps),
    [words, totalDurationMs, fps],
  );
  const speechBlocks = useMemo(() => buildSpeechBlocks(words), [words]);
  const sfxEvents = useMemo(
    () => buildSfxEvents(words, scenes, fps),
    [words, scenes, fps],
  );

  return (
    <AbsoluteFill>
      <Background />

      {scenes.map((timing) => {
        const SceneComponent = SCENE_COMPONENTS[timing.sceneId];
        if (!SceneComponent) return null;
        return (
          <Sequence
            key={timing.sceneId}
            from={timing.startFrame}
            durationInFrames={timing.durationInFrames}
            layout="none"
          >
            <SceneComponent timing={timing} words={words} />
          </Sequence>
        );
      })}

      <Captions words={words} />
      <ProgressBar />

      <Audio src={staticFile("assets/episode4/voiceover.mp3")} volume={1} />
      <Audio
        src={staticFile("assets/episode4/music.mp3")}
        volume={(f) => getMusicVolume((f / fps) * 1000, speechBlocks, totalDurationMs)}
      />

      {sfxEvents.map((ev, i) => (
        <Sequence
          key={`sfx-${i}`}
          from={ev.frame}
          durationInFrames={SFX_DURATION_FRAMES}
          layout="none"
        >
          <Audio src={staticFile(`sfx/${ev.sfx}.mp3`)} volume={0.45} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
