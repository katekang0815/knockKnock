import { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useDerivedValue,
  useAnimatedReaction,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import BouncingOrb from '@/components/BouncingOrb';
import VibratingOrb from '@/components/VibratingOrb';
import RollingOrb from '@/components/RollingOrb';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

const { width, height: SCREEN_H } = Dimensions.get('window');

const ICON_SIZE = 180;

// The four major emotions, ordered unpleasant → pleasant around the top arc.
const EMOTIONS: { category: EmotionCategory; render: (s: number) => React.ReactNode }[] = [
  { category: 'Stormy', render: (s) => <VibratingOrb size={s} /> },
  { category: 'Calm',   render: (s) => <RollingOrb size={s} /> },
  { category: 'Breezy', render: (s) => <RollingOrb size={s} fadeBall={false} /> },
  { category: 'Sunny',  render: (s) => <BouncingOrb size={s} /> },
];
const SECTIONS = EMOTIONS.length;
const DEFAULT_INDEX = EMOTIONS.findIndex((e) => e.category === 'Breezy');

// Dial geometry — a circle centered on the icon (moved ~100px down).
const CENTER_X = width / 2;
const CENTER_Y = SCREEN_H * 0.42 + 110;
const R = width * 0.36;   // bottom track arc radius
const DOT = 22;           // draggable dot diameter
const HIT = 46;           // dot touch target
const RAD = Math.PI / 180;

// Bottom track arc — 108° (120° reduced by 1/10), centered at the bottom.
const ARC_A = 144; // left end (deg, screen coords: 0 = right, 90 = down)
const ARC_B = 36;  // right end (deg)
const ARC_SPAN = ARC_A - ARC_B; // 108°
const TRACK_A_X = CENTER_X + R * Math.cos(ARC_A * RAD);
const TRACK_A_Y = CENTER_Y + R * Math.sin(ARC_A * RAD);
const TRACK_B_X = CENTER_X + R * Math.cos(ARC_B * RAD);
const TRACK_B_Y = CENTER_Y + R * Math.sin(ARC_B * RAD);
const TRACK_ARC = `M ${TRACK_A_X.toFixed(1)} ${TRACK_A_Y.toFixed(1)} A ${R} ${R} 0 0 0 ${TRACK_B_X.toFixed(1)} ${TRACK_B_Y.toFixed(1)}`;
const ARC_LEN = R * ARC_SPAN * RAD; // arc length (for the fill reveal)
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// Sub-emotion pills fan around the top — from just above the left track end,
// over the top, to just above the right track end (the complement of the arc).
// Every pill's inner edge sits at CAP_INNER; its length grows outward to fit
// its text, so short words get short pills (which fit near the screen edges).
const CAP_START = 158; // lower-left (just above ARC_A = 150)
const CAP_END = 382;   // lower-right (= 22°, just above ARC_B = 30)
const CAP_W_OUT = R * 0.28;  // wide tail (outer) diameter
const CAP_W_IN = R * 0.14;   // narrow head (inner) diameter
const CAP_FONT = 15;         // sub-emotion text size
const CAP_CHAR = CAP_FONT * 0.6; // approx per-character width
const CAP_PAD = 26;          // total end padding added to the text length
const SIDE_MARGIN = 10;      // min gap from the pills to the left/right screen edges

// Reorder words so the longest sit at the top of the arc (most room) and the
// shortest fall to the left/right edges (where the screen is narrowest).
function arrangeByLength(words: string[]) {
  const byLen = [...words].sort((a, b) => b.length - a.length); // longest first
  const n = words.length;
  const mid = Math.floor(n / 2);
  const order: number[] = [mid];
  for (let d = 1; d <= mid; d++) {
    order.push(mid - d);
    if (mid + d < n) order.push(mid + d);
  }
  const out = new Array<string>(n);
  order.forEach((pos, k) => {
    out[pos] = byLen[k];
  });
  return out;
}

function clampWorklet(v: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

// Map a touch to a position on the bottom track arc (0 = left end, 1 = right end).
// Above the center is the top gap → clamp to the nearest end so the dot
// stops at the arc's ends instead of wrapping back to the start.
function angleToT(absX: number, absY: number) {
  'worklet';
  const dx = absX - CENTER_X;
  const dy = absY - CENTER_Y;
  if (dy < 0) return dx >= 0 ? 1 : 0;
  const a = (Math.atan2(dy, dx) * 180) / Math.PI; // 0..180 on the lower half
  return clampWorklet((ARC_A - a) / ARC_SPAN, 0, 1);
}

// One sub-emotion pill. It scales up and back (a pulse) when `pulse` runs
// 0 → 1 → 0, scaling about its own center (originX/originY).
type PillProps = {
  d: string;
  shapeRot: string;
  tx: number;
  ty: number;
  textRot: string;
  word: string;
  cx: number;
  cy: number;
  pulse: { value: number };
};

function Pill({ d, shapeRot, tx, ty, textRot, word, cx, cy, pulse }: PillProps) {
  const animatedProps = useAnimatedProps(() => ({
    scale: 1 + pulse.value * 0.12,
  }));
  return (
    <AnimatedG animatedProps={animatedProps} originX={cx} originY={cy}>
      <Path d={d} fill="rgba(255,255,255,0.14)" transform={shapeRot} />
      <SvgText
        x={tx}
        y={ty}
        dy={CAP_FONT * 0.35}
        fill="#FFFFFF"
        fontSize={CAP_FONT}
        fontFamily="Jost_700Bold"
        textAnchor="middle"
        transform={textRot}
      >
        {word}
      </SvgText>
    </AnimatedG>
  );
}

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(DEFAULT_INDEX);
  // Default (freshly-arrived) state: bounce-only Breeze icon, track only, no pills.
  // Flips true the first time the user touches the track.
  const [started, setStarted] = useState(false);

  const category = EMOTIONS[active].category;
  // 15 sub-emotions, arranged longest-at-top → shortest-at-edges.
  const subEmotions = arrangeByLength(EMOTION_DATA[category].subEmotions.slice(0, 15));

  // Size the ring ONCE from the worst case across ALL categories, so every
  // emotion shares the exact same arc (the widest pill of any category lands
  // SIDE_MARGIN from the edge, and the tallest top pill stays below the title).
  const targetHalf = width / 2 - SIDE_MARGIN;
  const topLimit = insets.top + 116; // just below the title
  let capInner = R * 1.4;
  (Object.keys(EMOTION_DATA) as EmotionCategory[]).forEach((cat) => {
    const words = arrangeByLength(EMOTION_DATA[cat].subEmotions.slice(0, 15));
    const n = words.length;
    words.forEach((word, i) => {
      const phi = (n === 1 ? 270 : CAP_START + ((CAP_END - CAP_START) * i) / (n - 1)) * RAD;
      const pillL = word.length * CAP_CHAR + CAP_PAD;
      const c = Math.abs(Math.cos(phi));
      const s = Math.sin(phi);
      if (c > 0.02) capInner = Math.min(capInner, targetHalf / c - pillL - CAP_W_OUT / 2);
      if (s < -0.02) capInner = Math.min(capInner, (CENTER_Y - topLimit) / -s - pillL);
    });
  });
  capInner = Math.max(R * 0.55, capInner);

  // Position along the top arc, 0 (left) → 1 (right). Default = Breeze's section center.
  const t = useSharedValue((DEFAULT_INDEX + 0.5) / SECTIONS);
  // Pill pulse (0 → 1 → 0). Fires on each emotion change.
  const pulse = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(setStarted)(true);
      t.value = angleToT(e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => {
      t.value = angleToT(e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      const idx = clampWorklet(Math.floor(t.value * SECTIONS), 0, SECTIONS - 1);
      t.value = withTiming((idx + 0.5) / SECTIONS, { duration: 160 });
    });

  const index = useDerivedValue(() =>
    clampWorklet(Math.floor(t.value * SECTIONS), 0, SECTIONS - 1),
  );
  useAnimatedReaction(
    () => index.value,
    (cur, prev) => {
      if (cur !== prev) {
        runOnJS(setActive)(cur);
        // Pop the pills on navigation.
        pulse.value = withSequence(
          withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
        );
      }
    },
  );

  // Solid arc fills from the left up to the dot; the rest stays faded.
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: ARC_LEN * (1 - t.value),
  }));

  // Dot rides the bottom track arc.
  const dotStyle = useAnimatedStyle(() => {
    const phi = (ARC_A - ARC_SPAN * t.value) * RAD;
    const x = CENTER_X + R * Math.cos(phi);
    const y = CENTER_Y + R * Math.sin(phi);
    return { transform: [{ translateX: x - HIT / 2 }, { translateY: y - HIT / 2 }] };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Back arrow */}
      <TouchableOpacity
        style={[styles.backArrow, { top: insets.top + 16 }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      <Text style={[styles.title, { top: insets.top + 80 }]}>How are you today?</Text>

      {/* Dial: bottom track arc + top radial sub-emotion labels */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* solid track (inactive) — breeze halo color at its brightest */}
        <Path
          d={TRACK_ARC}
          stroke="#C78E7D"
          strokeOpacity={0.35}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        {/* solid coral fill from the left up to the dot */}
        <AnimatedPath
          d={TRACK_ARC}
          stroke="#DB533C"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={ARC_LEN}
          animatedProps={arcProps}
        />
        {started && subEmotions.map((word, i) => {
          const n = subEmotions.length;
          const phi = n === 1 ? 270 : CAP_START + ((CAP_END - CAP_START) * i) / (n - 1);
          const rad = phi * RAD;
          // Pill length fits the word; inner edge stays at capInner, grows outward.
          const pillL = word.length * CAP_CHAR + CAP_PAD;
          const capR = capInner + pillL / 2;
          const cx = CENTER_X + capR * Math.cos(rad);
          const cy = CENTER_Y + capR * Math.sin(rad);
          // Tapered pill: narrow head at the inner end, wide tail at the outer end.
          // Built horizontally (+x = outward) then rotated by the true angle so the
          // taper always points outward. Straight sides + semicircular end caps.
          const xi = cx - pillL / 2; // inner (head)
          const xo = cx + pillL / 2; // outer (tail)
          const wIn = CAP_W_IN / 2;
          const wOut = CAP_W_OUT / 2;
          const d =
            `M ${xi.toFixed(1)} ${(cy - wIn).toFixed(1)} ` +
            `L ${xo.toFixed(1)} ${(cy - wOut).toFixed(1)} ` +
            `A ${wOut} ${wOut} 0 0 1 ${xo.toFixed(1)} ${(cy + wOut).toFixed(1)} ` +
            `L ${xi.toFixed(1)} ${(cy + wIn).toFixed(1)} ` +
            `A ${wIn} ${wIn} 0 0 0 ${xi.toFixed(1)} ${(cy - wIn).toFixed(1)} Z`;
          const shapeRot = `rotate(${phi.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`;
          // Text uses the upright-normalized angle so it stays readable.
          let rot = phi % 180;
          if (rot > 90) rot -= 180;
          // Bias the text outward toward the wider tail so it clears the narrow head.
          const tShift = pillL * 0.08;
          const tx = CENTER_X + (capR + tShift) * Math.cos(rad);
          const ty = CENTER_Y + (capR + tShift) * Math.sin(rad);
          const textRot = `rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})`;
          return (
            <Pill
              key={word}
              d={d}
              shapeRot={shapeRot}
              tx={tx}
              ty={ty}
              textRot={textRot}
              word={word}
              cx={cx}
              cy={cy}
              pulse={pulse}
            />
          );
        })}
      </Svg>

      {/* Selected emotion icon — nudged down so the halo (which renders high in the
          container) lands on the circle center */}
      <TouchableOpacity
        style={[styles.iconArea, { top: CENTER_Y - ICON_SIZE / 2 + 65, left: CENTER_X - ICON_SIZE / 2 }]}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/subemotions', params: { category } })}
      >
        {started ? (
          EMOTIONS[active].render(ICON_SIZE)
        ) : (
          // Default screen: dedicated Breeze icon that only bounces (no roll).
          <RollingOrb size={ICON_SIZE} fadeBall={false} rolling={false} />
        )}
      </TouchableOpacity>

      {/* Draggable dot on the top arc */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.dotHit, dotStyle]}>
          <View style={styles.dotHalo} />
          <View style={styles.dot} />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  title: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Jost_700Bold',
    lineHeight: 34,
    textAlign: 'center',
  },
  iconArea: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  dotHit: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotHalo: {
    position: 'absolute',
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    backgroundColor: 'rgba(199,142,125,0.28)',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: '#DB533C',
    shadowColor: '#DB533C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  backArrow: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
