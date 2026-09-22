// The exact Episode 4 narration, in Roman Hinglish, split into 15 scenes.
// This is the single source of truth for:
//  - scripts/align-episode4.ts, which times every word against the
//    voiceover using the Whisper transcript, and
//  - the <Captions> component, which renders these exact words on screen.
//
// `annotations` marks specific words (by index within the scene, splitting
// `text` on whitespace) for special caption treatment: "money" words get
// gold + bigger + a tiny shake, "punch" words get a zoom-punch, and `emoji`
// appends an emoji after that word.

export type WordAnnotation = {
  emphasis?: "money" | "punch";
  emoji?: string;
};

export type ScriptScene = {
  id: string;
  text: string;
  annotations?: Record<number, WordAnnotation>;
};

export const SCRIPT_SCENES: ScriptScene[] = [
  {
    id: "scene01-queue",
    text: "Log naya iPhone 18 Pro lene ke liye line mein khade hain.",
    annotations: {
      2: { emoji: "📱" }, // iPhone
    },
  },
  {
    id: "scene02-scale",
    text: "Par ek aadmi ne do pizza ke badle lakhon iPhone de diye. Bina jaane.",
    annotations: {
      5: { emoji: "🍕" }, // pizza
      12: { emphasis: "punch" }, // Bina
      13: { emphasis: "punch", emoji: "😳" }, // jaane.
    },
  },
  {
    id: "scene03-title",
    text: "Welcome to Cryptonomics with Abhi. Bitcoin series, Episode 4.",
  },
  {
    id: "scene04-2010",
    text: "Saal 2010. Bitcoin naya-naya tha. Koi use seriously leta hi nahi tha.",
  },
  {
    id: "scene05-curious",
    text: "Tab ek aadmi ne socha, chalo check karte hain, kya Bitcoin se sach mein kuch khareeda ja sakta hai?",
  },
  {
    id: "scene06-order",
    text: "Usne do pizza order kiye. Aur payment kiya 10,000 Bitcoin mein.",
    annotations: {
      2: { emoji: "🍕" }, // pizza
      8: { emphasis: "money" }, // 10,000
    },
  },
  {
    id: "scene07-receipt",
    text: "Us waqt un 10,000 Bitcoin ki keemat thi lagbhag do hazaar rupaye. Matlab normal pizza ka normal bill.",
    annotations: {
      3: { emphasis: "money" }, // 10,000
      9: { emphasis: "money" }, // do
      10: { emphasis: "money" }, // hazaar
    },
  },
  {
    id: "scene08-today",
    text: "Aaj? Ek Bitcoin lagbhag 85 lakh rupaye ka hai. Toh un 10,000 Bitcoin ki keemat hoti 8,000 crore se bhi zyada.",
    annotations: {
      0: { emphasis: "punch" }, // Aaj?
      4: { emphasis: "money" }, // 85
      5: { emphasis: "money" }, // lakh
      11: { emphasis: "money" }, // 10,000
      16: { emphasis: "money" }, // 8,000
      17: { emphasis: "money", emoji: "💸" }, // crore
    },
  },
  {
    id: "scene09-phones",
    text: "Itne mein aaj lagbhag 5 lakh iPhone 18 Pro aa jaate. Aur woh bhi bina EMI ke.",
    annotations: {
      4: { emphasis: "money" }, // 5
      5: { emphasis: "money" }, // lakh
      8: { emoji: "📱" }, // Pro
    },
  },
  {
    id: "scene10-ferrari",
    text: "Socho, woh aadmi aaj bhi jab pizza order karta hoga, toh har slice mein ek Ferrari dikhti hogi.",
    annotations: {
      15: { emphasis: "punch", emoji: "🏎️" }, // Ferrari
    },
  },
  {
    id: "scene11-pizzaday",
    text: "Isliye har saal 22 May ko duniya bhar mein Bitcoin Pizza Day manaya jaata hai. Duniya ke sabse mehenge do pizza ki yaad mein.",
    annotations: {
      3: { emphasis: "money" }, // 22
      4: { emphasis: "money" }, // May
      10: { emoji: "🍕" }, // Pizza
    },
  },
  {
    id: "scene12-pause",
    text: "Par ek second. Iska matlab yeh nahi ki jo bhi cheez aaj sasti hai, kal crore ki ho jaayegi.",
    annotations: {
      1: { emphasis: "punch" }, // ek
      2: { emphasis: "punch" }, // second.
    },
  },
  {
    id: "scene13-rollercoaster",
    text: "Bitcoin ne upar bhi bade jhatke dekhe hain, aur neeche bhi. Value hamesha ek jaisi nahi rehti.",
    annotations: {
      11: { emoji: "⚠️" }, // Value
    },
  },
  {
    id: "scene14-blockchain",
    text: "Agle episode mein: Blockchain. Woh bhaari word, jo Indian Railways jitna simple hai.",
    annotations: {
      3: { emphasis: "punch" }, // Blockchain.
      9: { emoji: "🚆" }, // Railways
    },
  },
  {
    id: "scene15-cta",
    text: "Zero se advanced investor banna hai? Toh abhi like karo, follow karo, aur channel subscribe karo. Meri personal strategies ke liye Telegram join karo, link bio mein hai.",
    annotations: {
      8: { emoji: "👍" }, // like
      14: { emoji: "🔔" }, // subscribe
    },
  },
];

export const getSceneWords = (scene: ScriptScene): string[] =>
  scene.text.split(/\s+/).filter(Boolean);

export const getAllScriptWords = (): {
  sceneId: string;
  sceneWordIndex: number;
  text: string;
}[] =>
  SCRIPT_SCENES.flatMap((scene) =>
    getSceneWords(scene).map((text, sceneWordIndex) => ({
      sceneId: scene.id,
      sceneWordIndex,
      text,
    })),
  );
