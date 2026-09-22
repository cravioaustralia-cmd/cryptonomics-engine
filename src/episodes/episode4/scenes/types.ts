import type { EpisodeCaptionWord } from "../../shared/captionTypes";
import type { SceneTiming } from "../../shared/timing";

export type SceneProps = {
  timing: SceneTiming;
  words: EpisodeCaptionWord[];
};
