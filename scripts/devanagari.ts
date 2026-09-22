// Rough Devanagari -> Roman transliteration, used only to make fuzzy string
// matching between Whisper's Devanagari output and our Roman Hinglish script
// possible. It does not need to be linguistically perfect — just consistent
// enough that similar-sounding words land close together under Levenshtein
// distance.

const CONSONANTS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "v", "ळ": "l",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  "क़": "q", "ख़": "kh", "ग़": "g", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f", "य़": "y",
};

const INDEPENDENT_VOWELS: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "ii", "उ": "u", "ऊ": "uu",
  "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au",
  "अं": "an", "अः": "ah",
};

const MATRAS: Record<string, string> = {
  "ा": "aa", "ि": "i", "ी": "ii", "ु": "u", "ू": "uu",
  "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
};

const VIRAMA = "्";
const ANUSVARA = "ं";
const CHANDRABINDU = "ँ";
const VISARGA = "ः";
const NUKTA = "़";

const DIGITS: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

export const isDevanagari = (text: string): boolean =>
  /[ऀ-ॿ]/.test(text);

export const transliterateDevanagari = (text: string): string => {
  let out = "";
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];

    if (DIGITS[c]) {
      out += DIGITS[c];
      continue;
    }
    if (c === NUKTA) continue;
    if (c === ANUSVARA || c === CHANDRABINDU) {
      out += "n";
      continue;
    }
    if (c === VISARGA) {
      out += "h";
      continue;
    }
    if (INDEPENDENT_VOWELS[c]) {
      out += INDEPENDENT_VOWELS[c];
      continue;
    }
    if (CONSONANTS[c]) {
      out += CONSONANTS[c];
      if (next === VIRAMA) {
        i++; // suppress inherent schwa, consume the virama
      } else if (MATRAS[next]) {
        out += MATRAS[next];
        i++;
      } else {
        out += "a"; // inherent schwa
      }
      continue;
    }
    // Punctuation, Latin passthrough, danda "।", whitespace, etc.
    if (c === "।" || c === "॥") continue;
    out += c;
  }

  return out;
};

/** Normalizes any script (Devanagari or Roman) into a lowercase, punctuation-stripped form for fuzzy comparison. */
export const normalizeForMatching = (text: string): string => {
  const transliterated = isDevanagari(text)
    ? transliterateDevanagari(text)
    : text;
  return transliterated
    .toLowerCase()
    .replace(/[.,!?;:"'()।॥]/g, "")
    .replace(/\s+/g, "")
    .trim();
};
