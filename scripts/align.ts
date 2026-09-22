// Generic sequence-alignment primitives used to align our Roman Hinglish
// script against Whisper's (possibly Devanagari, possibly misspelled)
// word-level transcript.

export const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
};

/** Similarity in [0,1]; 1 = identical, 0 = completely different. */
export const similarity = (a: string, b: string): number => {
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - levenshtein(a, b) / maxLen;
};

export type AlignedPair = {
  scriptIndex: number | null;
  otherIndex: number | null;
  score: number;
};

/**
 * Needleman-Wunsch global alignment between two ordered sequences of
 * strings. Both sequences are known to be in the same spoken order (it's
 * the same audio), so a global monotonic alignment is the right tool —
 * unlike local alignment, it accounts for every element of both sequences
 * (as a match or a gap).
 */
export const globalAlign = (
  scriptWords: string[],
  otherWords: string[],
  gapPenalty = -0.55,
): AlignedPair[] => {
  const m = scriptWords.length;
  const n = otherWords.length;

  // score[i][j] = best score aligning scriptWords[0..i) with otherWords[0..j)
  const score: Float64Array[] = Array.from(
    { length: m + 1 },
    () => new Float64Array(n + 1),
  );
  const trace: Uint8Array[] = Array.from(
    { length: m + 1 },
    () => new Uint8Array(n + 1),
  ); // 0 = diag, 1 = up (gap in other), 2 = left (gap in script)

  for (let i = 1; i <= m; i++) {
    score[i][0] = score[i - 1][0] + gapPenalty;
    trace[i][0] = 1;
  }
  for (let j = 1; j <= n; j++) {
    score[0][j] = score[0][j - 1] + gapPenalty;
    trace[0][j] = 2;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const matchScore =
        score[i - 1][j - 1] +
        (similarity(scriptWords[i - 1], otherWords[j - 1]) * 2 - 1);
      const upScore = score[i - 1][j] + gapPenalty;
      const leftScore = score[i][j - 1] + gapPenalty;

      if (matchScore >= upScore && matchScore >= leftScore) {
        score[i][j] = matchScore;
        trace[i][j] = 0;
      } else if (upScore >= leftScore) {
        score[i][j] = upScore;
        trace[i][j] = 1;
      } else {
        score[i][j] = leftScore;
        trace[i][j] = 2;
      }
    }
  }

  const pairs: AlignedPair[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const dir = i > 0 && j > 0 ? trace[i][j] : i > 0 ? 1 : 2;
    if (dir === 0) {
      pairs.push({
        scriptIndex: i - 1,
        otherIndex: j - 1,
        score: similarity(scriptWords[i - 1], otherWords[j - 1]),
      });
      i--;
      j--;
    } else if (dir === 1) {
      pairs.push({ scriptIndex: i - 1, otherIndex: null, score: 0 });
      i--;
    } else {
      pairs.push({ scriptIndex: null, otherIndex: j - 1, score: 0 });
      j--;
    }
  }
  pairs.reverse();
  return pairs;
};
