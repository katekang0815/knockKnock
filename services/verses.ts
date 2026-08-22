import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Deterministic curated verse pool (no AI picks the verse). Tapping "Look for
 * verses" renders the next unused verse for the selected sub-emotion, following
 * that sub-emotion's tag-priority chain, using a global used-set per major
 * category (loops once the whole chain is consumed). References use ASCII
 * hyphens for ranges so the home-card verse parser (extractVerse) reads them.
 *
 * Only Stormy is populated for now; other categories return null so the caller
 * falls back to AI verse generation.
 */

export interface Verse {
  ref: string;
  text: string;
}

export interface PickedVerse extends Verse {
  emotion: string;
}

// Sub-detailed categories → member emotions (listed order = intra-group order).
const SUBCATEGORIES: Record<string, string[]> = {
  a: ['Furious', 'Annoyed', 'Irritated'],
  b: ['Scared', 'Nervous', 'Worried'],
  c: ['Tense', 'Anxious', 'Stressed', 'Frustrated'],
  d: ['Shocked', 'Overwhelmed'],
  e: ['Jealous'],
  f: ['Embarrassed'],
  g: ['Confused'],
};

// Tag-priority chain per sub-category (which groups to draw from, in order).
const CHAINS: Record<string, string[]> = {
  a: ['a', 'c', 'b', 'd', 'g', 'f', 'e'],
  b: ['b', 'c', 'd', 'a', 'g', 'f', 'e'],
  c: ['c', 'b', 'd', 'a', 'g', 'f', 'e'],
  d: ['d', 'b', 'c', 'a', 'g', 'f', 'e'],
  e: ['e', 'c', 'a', 'b', 'd', 'f', 'g'],
  f: ['f', 'b', 'a', 'c', 'd', 'g', 'e'],
  g: ['g', 'c', 'b', 'd', 'a', 'f', 'e'],
};

// emotion → sub-category (built from SUBCATEGORIES).
const EMOTION_TO_SUBCAT: Record<string, string> = {};
for (const [sub, emotions] of Object.entries(SUBCATEGORIES)) {
  for (const e of emotions) EMOTION_TO_SUBCAT[e] = sub;
}

// 3 verses each; 6 for Jealous / Embarrassed / Confused. KJV (public domain).
const VERSES: Record<string, Verse[]> = {
  Furious: [
    { ref: 'Ephesians 4:26', text: 'Be ye angry, and sin not: let not the sun go down upon your wrath.' },
    { ref: 'Proverbs 29:11', text: 'A fool uttereth all his mind: but a wise man keepeth it in till afterwards.' },
    { ref: 'Romans 12:19', text: 'Dearly beloved, avenge not yourselves, but rather give place unto wrath: for it is written, Vengeance is mine; I will repay, saith the Lord.' },
  ],
  Annoyed: [
    { ref: 'Proverbs 19:11', text: 'The discretion of a man deferreth his anger; and it is his glory to pass over a transgression.' },
    { ref: 'Ecclesiastes 7:9', text: 'Be not hasty in thy spirit to be angry: for anger resteth in the bosom of fools.' },
    { ref: 'Colossians 3:13', text: 'Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.' },
  ],
  Irritated: [
    { ref: 'Proverbs 15:1', text: 'A soft answer turneth away wrath: but grievous words stir up anger.' },
    { ref: 'James 1:19', text: 'Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath.' },
    { ref: 'Ephesians 4:31-32', text: 'Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you, with all malice: and be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ’s sake hath forgiven you.' },
  ],
  Scared: [
    { ref: 'Psalm 23:4', text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
    { ref: 'Psalm 27:1', text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?' },
    { ref: 'Isaiah 41:13', text: 'For I the LORD thy God will hold thy right hand, saying unto thee, Fear not; I will help thee.' },
  ],
  Nervous: [
    { ref: 'Joshua 1:9', text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.' },
    { ref: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.' },
    { ref: '2 Timothy 1:7', text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.' },
  ],
  Worried: [
    { ref: 'Matthew 6:25-27', text: 'Therefore I say unto you, Take no thought for your life, what ye shall eat, or what ye shall drink; nor yet for your body, what ye shall put on. Is not the life more than meat, and the body than raiment? Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they?' },
    { ref: 'Psalm 94:19', text: 'In the multitude of my thoughts within me thy comforts delight my soul.' },
    { ref: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.' },
  ],
  Tense: [
    { ref: 'Isaiah 26:3', text: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.' },
    { ref: 'Psalm 46:10', text: 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.' },
    { ref: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' },
  ],
  Anxious: [
    { ref: 'Philippians 4:6-7', text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' },
    { ref: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.' },
    { ref: 'Matthew 6:34', text: 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.' },
  ],
  Stressed: [
    { ref: 'Psalm 55:22', text: 'Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.' },
    { ref: 'Psalm 61:2', text: 'From the end of the earth will I cry unto thee, when my heart is overwhelmed: lead me to the rock that is higher than I.' },
    { ref: 'Exodus 33:14', text: 'And he said, My presence shall go with thee, and I will give thee rest.' },
  ],
  Frustrated: [
    { ref: 'Galatians 6:9', text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.' },
    { ref: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
    { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
  ],
  Shocked: [
    { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' },
    { ref: '2 Corinthians 4:8-9', text: 'We are troubled on every side, yet not distressed; we are perplexed, but not in despair; persecuted, but not forsaken; cast down, but not destroyed.' },
    { ref: 'Habakkuk 3:17-19', text: 'Although the fig tree shall not blossom, neither shall fruit be in the vines; the labour of the olive shall fail, and the fields shall yield no meat; the flock shall be cut off from the fold, and there shall be no herd in the stalls: yet I will rejoice in the LORD, I will joy in the God of my salvation.' },
  ],
  Overwhelmed: [
    { ref: 'Psalm 42:11', text: 'Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.' },
    { ref: '2 Corinthians 12:9', text: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.' },
    { ref: 'Psalm 18:16', text: 'He sent from above, he took me, he drew me out of many waters.' },
  ],
  Jealous: [
    { ref: '1 Corinthians 13:4', text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.' },
    { ref: 'Proverbs 14:30', text: 'A sound heart is the life of the flesh: but envy the rottenness of the bones.' },
    { ref: 'James 3:16', text: 'For where envying and strife is, there is confusion and every evil work.' },
    { ref: 'Galatians 5:26', text: 'Let us not be desirous of vain glory, provoking one another, envying one another.' },
    { ref: 'Psalm 37:1', text: 'Fret not thyself because of evildoers, neither be thou envious against the workers of iniquity.' },
    { ref: 'Philippians 4:11', text: 'Not that I speak in respect of want: for I have learned, in whatsoever state I am, therewith to be content.' },
  ],
  Embarrassed: [
    { ref: 'Psalm 34:5', text: 'They looked unto him, and were lightened: and their faces were not ashamed.' },
    { ref: 'Romans 10:11', text: 'For the scripture saith, Whosoever believeth on him shall not be ashamed.' },
    { ref: 'Isaiah 54:4', text: 'Fear not; for thou shalt not be ashamed: neither be thou confounded; for thou shalt not be put to shame: for thou shalt forget the shame of thy youth.' },
    { ref: 'Psalm 25:3', text: 'Yea, let none that wait on thee be ashamed: let them be ashamed which transgress without cause.' },
    { ref: 'Romans 8:1', text: 'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.' },
    { ref: 'Hebrews 4:16', text: 'Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.' },
  ],
  Confused: [
    { ref: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' },
    { ref: '1 Corinthians 14:33', text: 'For God is not the author of confusion, but of peace, as in all churches of the saints.' },
    { ref: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
    { ref: 'Proverbs 16:9', text: 'A man’s heart deviseth his way: but the LORD directeth his steps.' },
    { ref: 'Isaiah 30:21', text: 'And thine ears shall hear a word behind thee, saying, This is the way, walk ye in it, when ye turn to the right hand, and when ye turn to the left.' },
    { ref: 'Psalm 32:8', text: 'I will instruct thee and teach thee in the way which thou shalt go: I will guide thee with mine eye.' },
  ],
};

// Verse id = `${emotion}::${index}` (emotion labels contain no "::").
function verseId(emotion: string, index: number): string {
  return `${emotion}::${index}`;
}

// Full priority-ordered verse-id sequence for a chosen emotion: walk its chain;
// in the starting sub-category the tapped emotion leads, then its peers.
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

/** True if there's a curated pool for this emotion (i.e. Stormy, for now). */
export function hasVersePool(emotion: string): boolean {
  return !!VERSES[emotion];
}

/**
 * Pick the next unused verse for `emotion`, in tag-priority order, tracking a
 * global used-set per `category`. Loops (resets the used-set) once exhausted.
 * Returns null when there's no pool for the emotion.
 */
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
    used = []; // whole chain consumed → reset and loop
    chosen = seq[0];
  }
  used.push(chosen);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(used));
  } catch {
    // best-effort; a failed write just risks a possible repeat next time
  }

  const sep = chosen.lastIndexOf('::');
  const em = chosen.slice(0, sep);
  const idx = Number(chosen.slice(sep + 2));
  const v = VERSES[em]?.[idx];
  return v ? { emotion: em, ref: v.ref, text: v.text } : null;
}

// ===========================================================================
// Constrained selection (pick + reflection): the AI chooses a reference from a
// category's pool; the app validates it and renders its own exact text. Keyed
// by reference (unique across a pool), with a global used-set per category.
// The chain code above (selectVerse) is kept dormant for an easy revert.
// ===========================================================================

// Flattened per-category pools. Only Stormy is populated for now.
const CATEGORY_POOLS: Record<string, Verse[]> = {
  Stormy: Object.values(VERSES).flat(),
};

function usedKey(category: string): string {
  return `knockknock.verses.used.${category}.v2`;
}

function normalizeRef(s: string): string {
  return s
    .replace(/[–—]/g, '-') // en/em dash → hyphen
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
    // Whole pool consumed → reset and offer everything again.
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
