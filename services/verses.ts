import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Deterministic curated verse pool. Tapping "Look for verses" renders a verse
 * from this pool (the app owns the exact text, so Scripture is always accurate).
 *
 * Stormy is populated. Selection is currently "pick + reflection" (see
 * getUnusedCandidates/findVerse/commitUsed) — the AI chooses a reference from the
 * used-filtered pool and the app renders its own text. The chain helpers
 * (selectVerse/CHAINS) are kept dormant for an easy revert.
 *
 * Text is World English Bible (WEB, public domain), with the divine name
 * rendered as "the LORD" for familiarity with the teen/young-adult audience.
 * References use ASCII hyphens for ranges so extractVerse (home card) parses them.
 */

export interface Verse {
  ref: string;
  text: string;
}

export interface PickedVerse extends Verse {
  emotion: string;
}

// Sub-detailed categories → member emotions (dormant; used only by selectVerse).
const SUBCATEGORIES: Record<string, string[]> = {
  a: ['Furious', 'Annoyed', 'Irritated'],
  b: ['Scared', 'Nervous', 'Worried'],
  c: ['Tense', 'Anxious', 'Stressed', 'Frustrated'],
  d: ['Shocked', 'Overwhelmed'],
  e: ['Jealous'],
  f: ['Embarrassed'],
  g: ['Confused'],
};

const CHAINS: Record<string, string[]> = {
  a: ['a', 'c', 'b', 'd', 'g', 'f', 'e'],
  b: ['b', 'c', 'd', 'a', 'g', 'f', 'e'],
  c: ['c', 'b', 'd', 'a', 'g', 'f', 'e'],
  d: ['d', 'b', 'c', 'a', 'g', 'f', 'e'],
  e: ['e', 'c', 'a', 'b', 'd', 'f', 'g'],
  f: ['f', 'b', 'a', 'c', 'd', 'g', 'e'],
  g: ['g', 'c', 'b', 'd', 'a', 'f', 'e'],
};

const EMOTION_TO_SUBCAT: Record<string, string> = {};
for (const [sub, emotions] of Object.entries(SUBCATEGORIES)) {
  for (const e of emotions) EMOTION_TO_SUBCAT[e] = sub;
}

// WEB text (public domain). Verify against an authoritative WEB source before
// public launch. 3 verses each; 6 for Jealous / Embarrassed / Confused.
const VERSES: Record<string, Verse[]> = {
  Furious: [
    { ref: 'Ephesians 4:26', text: "Be angry, and don't sin. Don't let the sun go down on your wrath." },
    { ref: 'Psalm 103:8', text: 'The LORD is merciful and gracious, slow to anger, and abundant in loving kindness.' },
    { ref: 'Romans 12:19', text: "Don't seek revenge yourselves, beloved, but give place to God's wrath. For it is written, 'Vengeance belongs to me; I will repay, says the Lord.'" },
  ],
  Annoyed: [
    { ref: 'Proverbs 19:11', text: 'The discretion of a man makes him slow to anger. It is his glory to overlook an offense.' },
    { ref: 'Proverbs 16:32', text: 'One who is slow to anger is better than the mighty; one who rules his spirit, than he who takes a city.' },
    { ref: 'Colossians 3:13', text: 'bearing with one another, and forgiving each other, if any man has a complaint against any; even as Christ forgave you, so you also do.' },
  ],
  Irritated: [
    { ref: 'Proverbs 15:1', text: 'A gentle answer turns away wrath, but a harsh word stirs up anger.' },
    { ref: 'James 1:19', text: 'let every man be swift to hear, slow to speak, and slow to anger;' },
    { ref: 'Ephesians 4:31-32', text: 'Let all bitterness, wrath, anger, outcry, and slander be put away from you, with all malice. And be kind to one another, tenderhearted, forgiving each other, just as God also in Christ forgave you.' },
  ],
  Scared: [
    { ref: 'Psalm 23:4', text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.' },
    { ref: 'Psalm 27:1', text: 'The LORD is my light and my salvation. Whom shall I fear? The LORD is the strength of my life. Of whom shall I be afraid?' },
    { ref: 'Isaiah 41:13', text: "For I, the LORD your God, will hold your right hand, saying to you, 'Don't be afraid. I will help you.'" },
  ],
  Nervous: [
    { ref: 'Joshua 1:9', text: "Haven't I commanded you? Be strong and courageous. Don't be afraid. Don't be dismayed, for the LORD your God is with you wherever you go." },
    { ref: 'Isaiah 41:10', text: "Don't be afraid, for I am with you. Don't be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness." },
    { ref: '2 Timothy 1:7', text: "For God didn't give us a spirit of fear, but of power, love, and self-control." },
  ],
  Worried: [
    { ref: 'Matthew 6:25-27', text: "Therefore don't be anxious for your life: what you will eat, or what you will drink; nor yet for your body, what you will wear. Isn't life more than food, and the body more than clothing? See the birds of the sky, that they don't sow, neither do they reap, nor gather into barns. Your heavenly Father feeds them. Aren't you of much more value than they?" },
    { ref: 'Psalm 94:19', text: 'In the multitude of my thoughts within me, your comforts delight my soul.' },
    { ref: 'John 14:27', text: "Peace I leave with you. My peace I give to you; not as the world gives, give I to you. Don't let your heart be troubled, neither let it be fearful." },
  ],
  Tense: [
    { ref: 'Isaiah 26:3', text: "You will keep whoever's mind is steadfast in perfect peace, because he trusts in you." },
    { ref: 'Psalm 46:10', text: 'Be still, and know that I am God. I will be exalted among the nations. I will be exalted in the earth.' },
    { ref: 'Matthew 11:28', text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.' },
  ],
  Anxious: [
    { ref: 'Philippians 4:6-7', text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.' },
    { ref: '1 Peter 5:7', text: 'casting all your worries on him, because he cares for you.' },
    { ref: 'Matthew 6:34', text: "Therefore don't be anxious for tomorrow, for tomorrow will be anxious for itself. Each day's own evil is sufficient." },
  ],
  Stressed: [
    { ref: 'Psalm 55:22', text: 'Cast your burden on the LORD and he will sustain you. He will never allow the righteous to be moved.' },
    { ref: 'Psalm 61:2', text: 'From the end of the earth, I will call to you when my heart is overwhelmed. Lead me to the rock that is higher than I.' },
    { ref: 'Exodus 33:14', text: "He said, 'My presence will go with you, and I will give you rest.'" },
  ],
  Frustrated: [
    { ref: 'Galatians 6:9', text: "Let us not be weary in doing good, for we will reap in due season, if we don't give up." },
    { ref: 'Proverbs 3:5-6', text: "Trust in the LORD with all your heart, and don't lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight." },
    { ref: 'Isaiah 40:31', text: 'but those who wait for the LORD will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.' },
  ],
  Shocked: [
    { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' },
    { ref: '2 Corinthians 4:8-9', text: 'We are pressed on every side, yet not crushed; perplexed, yet not to despair; pursued, yet not forsaken; struck down, yet not destroyed;' },
    { ref: 'Isaiah 43:2', text: 'When you pass through the waters, I will be with you, and through the rivers, they will not overflow you. When you walk through the fire, you will not be burned, and flame will not scorch you.' },
  ],
  Overwhelmed: [
    { ref: 'Psalm 42:11', text: 'Why are you in despair, my soul? Why are you disturbed within me? Hope in God! For I shall still praise him, the saving help of my countenance, and my God.' },
    { ref: '2 Corinthians 12:9', text: "He has said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Most gladly therefore I will rather glory in my weaknesses, that the power of Christ may rest on me." },
    { ref: 'Psalm 18:16', text: 'He sent from on high. He took me. He drew me out of many waters.' },
  ],
  Jealous: [
    { ref: '1 Corinthians 13:4', text: "Love is patient and is kind. Love doesn't envy. Love doesn't brag, is not proud," },
    { ref: 'Psalm 139:14', text: 'I will give thanks to you, for I am fearfully and wonderfully made. Your works are wonderful, and my soul knows that very well.' },
    { ref: 'Galatians 6:4', text: 'But let each man examine his own work, and then he will have reason for boasting in himself alone, and not in someone else.' },
    { ref: 'Galatians 5:26', text: "Let's not become conceited, provoking one another, and envying one another." },
    { ref: 'Psalm 37:1', text: "Don't fret because of evildoers, neither be envious against those who work unrighteousness." },
    { ref: 'Philippians 4:11', text: 'I have learned, in whatever state I am, to be content in it.' },
  ],
  Embarrassed: [
    { ref: 'Psalm 34:5', text: 'They looked to him, and were radiant. Their faces shall never be covered with shame.' },
    { ref: 'Romans 10:11', text: "For the Scripture says, 'Whoever believes in him will not be disappointed.'" },
    { ref: 'Isaiah 54:4', text: "Don't be afraid, for you will not be ashamed. Don't be confounded, for you will not be disappointed. For you will forget the shame of your youth." },
    { ref: 'Psalm 25:3', text: 'Yes, no one who waits for you will be shamed.' },
    { ref: 'Romans 8:1', text: 'There is therefore now no condemnation to those who are in Christ Jesus.' },
    { ref: 'Hebrews 4:16', text: "Let's therefore draw near with boldness to the throne of grace, that we may receive mercy, and may find grace for help in time of need." },
  ],
  Confused: [
    { ref: 'James 1:5', text: 'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him.' },
    { ref: '1 Corinthians 14:33', text: 'for God is not a God of confusion, but of peace.' },
    { ref: 'Psalm 119:105', text: 'Your word is a lamp to my feet, and a light for my path.' },
    { ref: 'Proverbs 16:9', text: "A man's heart plans his course, but the LORD directs his steps." },
    { ref: 'Isaiah 30:21', text: "When you turn to the right hand, and when you turn to the left, your ears will hear a voice behind you, saying, 'This is the way. Walk in it.'" },
    { ref: 'Psalm 32:8', text: 'I will instruct you and teach you in the way which you shall go. I will counsel you with my eye on you.' },
  ],
};

function verseId(emotion: string, index: number): string {
  return `${emotion}::${index}`;
}

function buildSequence(emotion: string): string[] {
  const startSub = EMOTION_TO_SUBCAT[emotion];
  if (!startSub) return [];
  const ids: string[] = [];
  for (const sub of CHAINS[startSub]) {
    const members =
      sub === startSub
        ? [emotion, ...SUBCATEGORIES[sub].filter((e) => e !== emotion)]
        : SUBCATEGORIES[sub];
    for (const e of members) {
      const list = VERSES[e] || [];
      for (let i = 0; i < list.length; i++) ids.push(verseId(e, i));
    }
  }
  return ids;
}

/** True if there's a curated pool for this emotion. */
export function hasVersePool(emotion: string): boolean {
  return !!VERSES[emotion];
}

/** DORMANT: deterministic tag-chain selection (kept for an easy revert). */
export async function selectVerse(category: string, emotion: string): Promise<PickedVerse | null> {
  const seq = buildSequence(emotion);
  if (seq.length === 0) return null;
  const key = `knockknock.verses.used.${category}.v1`;
  let used: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) used = JSON.parse(raw) as string[];
  } catch {
    used = [];
  }
  const usedSet = new Set(used);
  let chosen = seq.find((id) => !usedSet.has(id));
  if (!chosen) {
    used = [];
    chosen = seq[0];
  }
  used.push(chosen);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(used));
  } catch {
    // best-effort
  }
  const sep = chosen.lastIndexOf('::');
  const em = chosen.slice(0, sep);
  const idx = Number(chosen.slice(sep + 2));
  const v = VERSES[em]?.[idx];
  return v ? { emotion: em, ref: v.ref, text: v.text } : null;
}

// ===========================================================================
// Constrained selection (pick + reflection): the AI chooses a reference from a
// category's pool; the app validates it and renders its own exact text.
// ===========================================================================

const CATEGORY_POOLS: Record<string, Verse[]> = {
  Stormy: Object.values(VERSES).flat(),
};

function usedKey(category: string): string {
  return `knockknock.verses.used.${category}.v2`;
}

function normalizeRef(s: string): string {
  return s
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** True if the major category has a curated pool (Stormy, for now). */
export function hasVersePoolForCategory(category: string): boolean {
  return !!CATEGORY_POOLS[category];
}

/** Verses in the category's pool not yet in the used-set (resets when empty). */
export async function getUnusedCandidates(category: string): Promise<Verse[]> {
  const pool = CATEGORY_POOLS[category];
  if (!pool) return [];
  let used: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(usedKey(category));
    if (raw) used = JSON.parse(raw) as string[];
  } catch {
    used = [];
  }
  const usedSet = new Set(used.map(normalizeRef));
  const candidates = pool.filter((v) => !usedSet.has(normalizeRef(v.ref)));
  if (candidates.length === 0) {
    try {
      await AsyncStorage.removeItem(usedKey(category));
    } catch {
      // best-effort
    }
    return pool.slice();
  }
  return candidates;
}

/** Look up the exact verse for a reference (validates the AI's choice). */
export function findVerse(category: string, ref: string): Verse | null {
  const pool = CATEGORY_POOLS[category];
  if (!pool) return null;
  const target = normalizeRef(ref);
  return pool.find((v) => normalizeRef(v.ref) === target) ?? null;
}

/** App-side fallback pick when the AI's choice is invalid or the call fails. */
export function pickFallback(candidates: Verse[]): Verse | null {
  return candidates.length ? candidates[0] : null;
}

/** Record a reference as shown (global used-set per category). */
export async function commitUsed(category: string, ref: string): Promise<void> {
  let used: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(usedKey(category));
    if (raw) used = JSON.parse(raw) as string[];
  } catch {
    used = [];
  }
  if (!used.some((r) => normalizeRef(r) === normalizeRef(ref))) used.push(ref);
  try {
    await AsyncStorage.setItem(usedKey(category), JSON.stringify(used));
  } catch {
    // best-effort
  }
}
