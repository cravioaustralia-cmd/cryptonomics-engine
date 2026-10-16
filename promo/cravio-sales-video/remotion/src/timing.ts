import heroJson from './timing/hero.json';
import socialJson from './timing/social.json';

export type Timing = typeof heroJson;
export const HERO = heroJson as Timing;
export const SOCIAL = socialJson as unknown as Timing;

const norm = (s: string) => s.replace(/[.,?!'"’]/g, '').toLowerCase();

/** Output time (s) of the nth occurrence of a word in a scene's VO. */
export const wordAt = (tm: Timing, scene: number, word: string, nth = 0, edge: 't' | 'e' = 't') => {
  const hits = tm.words.filter((w) => w.scene === scene && norm(w.w) === norm(word));
  if (!hits[nth]) throw new Error(`word not found: scene ${scene} "${word}" #${nth}`);
  return hits[nth][edge];
};

export const scene = (tm: Timing, id: number) => {
  const s = tm.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`scene ${id}`);
  return s;
};

export const voOf = (tm: Timing, id: number) => tm.vo.find((v) => v.scene === id)!;
