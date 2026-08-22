import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useDerivedValue,
  useAnimatedReaction,
  withTiming,
  withSequence,
  withRepeat,
  interpolateColor,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import BouncingOrb from '@/components/BouncingOrb';
import VibratingOrb from '@/components/VibratingOrb';
import RollingOrb from '@/components/RollingOrb';
import { EMOTION_DATA, EmotionCategory } from '@/constants/emotions';

const { width, height: SCREEN_H } = Dimensions.get('window');

const ICON_SIZE = 180;

// The four major emotions, ordered unpleasant → pleasant around the top arc.
const EMOTIONS: { category: EmotionCategory; render: (s: number) => React.ReactNode }[] = [
  { category: 'Stormy', render: (s) => <VibratingOrb size={s} /> },
  { category: 'Rain',   render: (s) => <RollingOrb size={s} rain /> },
  { category: 'Breezy', render: (s) => <RollingOrb size={s} fadeBall={false} /> },
  { category: 'Sunny',  render: (s) => <BouncingOrb size={s} rays /> },
];
const DEFAULT_INDEX = EMOTIONS.findIndex((e) => e.category === 'Breezy');

// Dial geometry — a circle centered on the icon (moved ~100px down).
const CENTER_X = width / 2;
const CENTER_Y = SCREEN_H * 0.42 + 110;
const R = width * 0.36;   // circle track radius
const DOT = 22;           // handle dot diameter
const HIT = 46;           // handle container
const RAD = Math.PI / 180;
const SPIN_S = 2 * (R + 34);   // rotating fade-ring canvas
const DIAL_SIZE = 2 * (R + 95); // transparent touch area covering the dial + pills

// Section indices within EMOTIONS (order: Stormy, Rain, Breezy, Sunny).
const I_STORMY = EMOTIONS.findIndex((e) => e.category === 'Stormy');
const I_RAIN = EMOTIONS.findIndex((e) => e.category === 'Rain');
const I_BREEZY = EMOTIONS.findIndex((e) => e.category === 'Breezy');
const I_SUNNY = EMOTIONS.findIndex((e) => e.category === 'Sunny');

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Sub-emotion pills fan around the point opposite the handle; each pill's inner
// edge sits at capInner and its length grows outward to fit its text.
const CAP_W_OUT = R * 0.28;  // wide tail (outer) diameter
const CAP_W_IN = R * 0.14;   // narrow head (inner) diameter
const CAP_FONT = 15;         // sub-emotion text size
const CAP_CHAR = CAP_FONT * 0.6; // approx per-character width
const CAP_PAD = 26;          // total end padding added to the text length
const PILL_ROUND = 12;       // pill corner rounding (rounded trapezoid)
const SIDE_MARGIN = 10;      // min gap from the pills to the left/right screen edges
const FAN_HALF = 120;        // pills span ±FAN_HALF around the point opposite the handle
const REVEAL_FADE = 0.3;     // per-pill fade window during the clockwise reveal

// Handle angle (deg) at each section's center — pills fan on the OPPOSITE side.
const SECTION_HANDLE: Record<number, number> = {
  [I_BREEZY]: 45,   // bottom-right
  [I_RAIN]: 135,    // bottom-left
  [I_SUNNY]: 225,   // top-left
  [I_STORMY]: 315,  // top-right
};

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

// Rounded-corner polygon path from a list of screen points.
function roundedPath(pts: [number, number][], r: number) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[(i - 1 + n) % n];
    const [vx, vy] = pts[i];
    const [nx, ny] = pts[(i + 1) % n];
    const l1 = Math.hypot(vx - px, vy - py) || 1;
    const l2 = Math.hypot(nx - vx, ny - vy) || 1;
    const r1 = Math.min(r, l1 / 2);
    const r2 = Math.min(r, l2 / 2);
    const a1x = vx + ((px - vx) / l1) * r1;
    const a1y = vy + ((py - vy) / l1) * r1;
    const a2x = vx + ((nx - vx) / l2) * r2;
    const a2y = vy + ((ny - vy) / l2) * r2;
    d += `${i === 0 ? 'M' : 'L'} ${a1x.toFixed(1)} ${a1y.toFixed(1)} `;
    d += `Q ${vx.toFixed(1)} ${vy.toFixed(1)} ${a2x.toFixed(1)} ${a2y.toFixed(1)} `;
  }
  return `${d}Z`;
}

// Touch → angle on the full-circle track (degrees, 0 = right, 90 = down), 0..360.
function touchAngle(absX: number, absY: number) {
  'worklet';
  let a = (Math.atan2(absY - CENTER_Y, absX - CENTER_X) * 180) / Math.PI;
  if (a < 0) a += 360;
  return a;
}

// Which emotion section a circle angle falls in:
//   bottom-right (0–90) → Breezy, bottom-left (90–180) → Rain,
//   top-left (180–270) → Sunny, top-right (270–360) → Stormy.
function angleToIndex(a: number) {
  'worklet';
  if (a < 90) return I_BREEZY;
  if (a < 180) return I_RAIN;
  if (a < 270) return I_SUNNY;
  return I_STORMY;
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
  reveal: { value: number };
  threshold: number;
  index: number;
  selectedIdx: { value: number };
  selectSV: { value: number };
};

function Pill({ d, shapeRot, tx, ty, textRot, word, cx, cy, pulse, reveal, threshold, index, selectedIdx, selectSV }: PillProps) {
  const groupProps = useAnimatedProps(() => {
    const sel = selectedIdx.value === index ? selectSV.value : 0;
    return {
      scale: 1 + pulse.value * 0.12 + sel * 0.35, // grow when selected
      opacity: Math.min(Math.max((reveal.value - threshold) / REVEAL_FADE, 0), 1),
    };
  });
  // Fill brightens to a vivid rose while selected — reliable visual feedback.
  const fillProps = useAnimatedProps(() => {
    const sel = selectedIdx.value === index ? selectSV.value : 0;
    return {
      fill: interpolateColor(sel, [0, 1], ['rgba(199,142,125,0.3)', 'rgba(224,150,132,0.9)']),
    };
  });
  return (
    <AnimatedG animatedProps={groupProps} originX={cx} originY={cy}>
      <AnimatedPath d={d} transform={shapeRot} animatedProps={fillProps} />
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
  // Default (freshly-arrived) state: bounce-only Breezy icon, track only, no pills.
  // Flips true the first time the user touches the track.
  const [started, setStarted] = useState(false);
  // Direction of the last dial move (1 = clockwise, -1 = counter-clockwise) — the
  // pill reveal sweeps this way.
  const [revealDir, setRevealDir] = useState(1);

  const category = EMOTIONS[active].category;
  // 15 sub-emotions, arranged longest-at-top → shortest-at-edges.
  const subEmotions = arrangeByLength(EMOTION_DATA[category].subEmotions.slice(0, 15));

  // Size the ring ONCE from the worst case across ALL categories, so every
  // emotion shares the exact same arc (the widest pill of any category lands
  // SIDE_MARGIN from the edge, and the tallest top pill stays below the title).
  const targetHalf = width / 2 - SIDE_MARGIN;
  const topLimit = insets.top + 116; // just below the title
  const bottomLimit = SCREEN_H - insets.bottom - 20;
  let capInner = R * 1.4;
  // Fit across every fan orientation (opposite each of the four handle positions).
  [225, 315, 45, 135].forEach((fanC) => {
    (Object.keys(EMOTION_DATA) as EmotionCategory[]).forEach((cat) => {
      const words = arrangeByLength(EMOTION_DATA[cat].subEmotions.slice(0, 15));
      const n = words.length;
      words.forEach((word, i) => {
        const phi = (n === 1 ? fanC : fanC - FAN_HALF + (2 * FAN_HALF * i) / (n - 1)) * RAD;
        const pillL = word.length * CAP_CHAR + CAP_PAD;
        const c = Math.abs(Math.cos(phi));
        const s = Math.sin(phi);
        if (c > 0.02) capInner = Math.min(capInner, targetHalf / c - pillL - CAP_W_OUT / 2);
        if (s < -0.02) capInner = Math.min(capInner, (CENTER_Y - topLimit) / -s - pillL);
        if (s > 0.02) capInner = Math.min(capInner, (bottomLimit - CENTER_Y) / s - pillL);
      });
    });
  });
  capInner = Math.max(100, capInner); // push the pills' inner edge out to ≥100pt

  // Pills fan on the side opposite the active section's handle.
  const fanCenter = (SECTION_HANDLE[active] ?? 45) + 180;

  // Pill pulse (0 → 1 → 0). Fires on each section change.
  const pulse = useSharedValue(0);
  // Pill reveal progress (0 → 1). Replays on each section change.
  const reveal = useSharedValue(1);
  // Selection pop: which pill (index) is selected, and its grow-and-back progress.
  const selectedIdx = useSharedValue(-1);
  const selectSV = useSharedValue(0);
  // Idle fading-ring rotation — VISUAL ONLY, default state.
  const spin = useSharedValue(0);
  // Handle / dial angle (ring rotation). Changed ONLY by dragging — never by the
  // idle spin — so the active section is driven purely by the user's dial.
  const dialAngle = useSharedValue(135); // handle at Breezy (45°) by default
  // 1 once the user has started dialing (drag). Gates reveal + section changes.
  const startedSV = useSharedValue(0);
  // Last dial direction (1 = CW, -1 = CCW).
  const dialDir = useSharedValue(1);
  // Handle (ball) visibility — only while actively dialing.
  const grab = useSharedValue(0);
  // 1 while an in-progress pan is actually dialing.
  const panActive = useSharedValue(0);
  // Whether the drag started somewhere dialing is allowed (arc / default state).
  const canDial = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.linear }), -1, false);
  }, [spin]);

  // Ring: idle spin in the default state; follows the dial once started.
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${startedSV.value === 1 ? dialAngle.value : spin.value * 360}deg` }],
  }));
  // Visible handle riding the dial (screen angle = dialAngle - 90).
  const ballStyle = useAnimatedStyle(() => {
    const a = (dialAngle.value - 90) * RAD;
    const x = CENTER_X + R * Math.cos(a);
    const y = CENTER_Y + R * Math.sin(a);
    return {
      opacity: grab.value,
      transform: [{ translateX: x - HIT / 2 }, { translateY: y - HIT / 2 }],
    };
  });

  const navToLog = (emotion: string) => {
    router.push({ pathname: '/emotionlog', params: { emotion, category } });
  };

  // Tap a sub-emotion pill → pop it (grow & back over ~1s), then open its log.
  const handlePillTap = (absX: number, absY: number) => {
    if (!started) return;
    const dx = absX - CENTER_X;
    const dy = absY - CENTER_Y;
    const radius = Math.hypot(dx, dy);
    let a = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (a < 0) a += 360;
    const n = subEmotions.length;
    if (n === 0) return;
    const spacing = n === 1 ? 360 : (2 * FAN_HALF) / (n - 1);
    for (let i = 0; i < n; i++) {
      const phi = (((fanCenter - FAN_HALF + spacing * i) % 360) + 360) % 360;
      let diff = Math.abs(a - phi);
      if (diff > 180) diff = 360 - diff;
      const pillL = subEmotions[i].length * CAP_CHAR + CAP_PAD;
      if (diff <= spacing / 2 && radius >= capInner - 12 && radius <= capInner + pillL + 12) {
        const emotion = subEmotions[i];
        selectedIdx.value = i;
        selectSV.value = withSequence(
          withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }), // quick grow
          withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }, (finished) => {
            if (finished) runOnJS(navToLog)(emotion); // back to original → navigate
          }),
        );
        return;
      }
    }
  };

  // DIAL — only a deliberate circular DRAG rotates the wheel and reveals the list.
  const dialPan = Gesture.Pan()
    .minDistance(14)
    .onBegin(() => {
      panActive.value = 0;
      canDial.value = 1; // dial from anywhere on the circle — a tap still navigates to a pill
    })
    .onUpdate((e) => {
      if (canDial.value === 0) return; // drag began outside the arc → ignore
      if (panActive.value === 0) {
        panActive.value = 1;
        startedSV.value = 1;
        grab.value = withTiming(1, { duration: 100 });
        runOnJS(setStarted)(true);
      }
      const a = touchAngle(e.absoluteX, e.absoluteY) + 90;
      let delta = a - dialAngle.value;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      if (delta > 0.001) dialDir.value = 1;
      else if (delta < -0.001) dialDir.value = -1;
      dialAngle.value = a;
    })
    .onEnd(() => {
      if (panActive.value === 1) {
        const fa = (((dialAngle.value - 90) % 360) + 360) % 360; // finger angle
        const section = Math.floor(fa / 90);
        dialAngle.value = withTiming(section * 90 + 45 + 90, { duration: 180 }); // snap to section center
      }
    })
    .onFinalize(() => {
      if (panActive.value === 1) grab.value = withTiming(0, { duration: 200 }); // hide handle
      panActive.value = 0;
    });

  // TAP a pill → select + navigate. Exclusive with the pan (which needs a real
  // drag), so a tap never dials and a drag never selects.
  const tapNav = Gesture.Tap()
    .maxDistance(20)
    .onEnd((e) => {
      runOnJS(handlePillTap)(e.absoluteX, e.absoluteY);
    });
  const dialGesture = Gesture.Exclusive(dialPan, tapNav);

  // Active section derived from the DIAL angle only (never the idle spin).
  const index = useDerivedValue(() => {
    const fa = (((dialAngle.value - 90) % 360) + 360) % 360;
    return angleToIndex(fa);
  });
  useAnimatedReaction(
    () => index.value,
    (cur, prev) => {
      if (cur !== prev && startedSV.value === 1) {
        runOnJS(setActive)(cur);
        runOnJS(setRevealDir)(dialDir.value); // reveal sweeps the way you dialed
        // Medium impact as the handle crosses into a new section.
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        // Pop the pills on section change.
        pulse.value = withSequence(
          withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
        );
        // Replay the clockwise reveal for the new section's pills.
        reveal.value = 0;
        reveal.value = withTiming(1, { duration: 1200 });
      }
    },
  );

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
      {!started && (
        <Text style={[styles.hint, { top: insets.top + 120 }]}>Turn the dial to explore</Text>
      )}

      {/* Sub-emotion pills (revealed once dialing has started) */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {started && subEmotions.map((word, i) => {
          const n = subEmotions.length;
          const phi = n === 1 ? fanCenter : fanCenter - FAN_HALF + (2 * FAN_HALF * i) / (n - 1);
          const rad = phi * RAD;
          // Pill length fits the word; inner edge stays at capInner, grows outward.
          const pillL = word.length * CAP_CHAR + CAP_PAD;
          const capR = capInner + pillL / 2;
          const cx = CENTER_X + capR * Math.cos(rad);
          const cy = CENTER_Y + capR * Math.sin(rad);
          // Rounded trapezoid: wide flat outer edge, narrow flat inner edge, straight
          // sides, rounded corners. Built horizontally (+x = outward) then rotated.
          const xi = cx - pillL / 2; // inner (narrow)
          const xo = cx + pillL / 2; // outer (wide)
          const wIn = CAP_W_IN / 2;
          const wOut = CAP_W_OUT / 2;
          const d = roundedPath(
            [
              [xi, cy - wIn],
              [xo, cy - wOut],
              [xo, cy + wOut],
              [xi, cy + wIn],
            ],
            PILL_ROUND,
          );
          const shapeRot = `rotate(${phi.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`;
          // Text uses the upright-normalized angle so it stays readable.
          let rot = phi % 180;
          if (rot > 90) rot -= 180;
          // Head-side gap (text inner end → pill head) is CAP_PAD/2 plus the outward
          // bias. Pull the text inward so that head gap is halved.
          const headGap = CAP_PAD / 2 + pillL * 0.04;
          const tShift = pillL * 0.04 - headGap / 2;
          const tx = CENTER_X + (capR + tShift) * Math.cos(rad);
          const ty = CENTER_Y + (capR + tShift) * Math.sin(rad);
          const textRot = `rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})`;
          // Stagger sweeps the way the user dialed: CW → i=0 first; CCW → i=n-1 first.
          const order = revealDir === 1 ? i : n - 1 - i;
          const threshold = n === 1 ? 0 : (order / (n - 1)) * (1 - REVEAL_FADE);
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
              reveal={reveal}
              threshold={threshold}
              index={i}
              selectedIdx={selectedIdx}
              selectSV={selectSV}
            />
          );
        })}
      </Svg>

      {/* Dial touch area — grab anywhere in this disk to rotate. Placed ABOVE the
          full-screen Svg (which would otherwise swallow touches) but BELOW the
          center icon so the icon's tap still works. */}
      <GestureDetector gesture={dialGesture}>
        <View
          collapsable={false}
          style={[styles.dialArea, { top: CENTER_Y - DIAL_SIZE / 2, left: CENTER_X - DIAL_SIZE / 2 }]}
        />
      </GestureDetector>

      {/* Selected emotion icon — nudged down so the halo (which renders high in the
          container) lands on the circle center. Non-interactive: the dial handles
          touches and each sub-emotion pill navigates to its log. */}
      <View
        pointerEvents="none"
        style={[styles.iconArea, { top: CENTER_Y - ICON_SIZE / 2 + 65, left: CENTER_X - ICON_SIZE / 2 }]}
      >
        {started ? (
          EMOTIONS[active].render(ICON_SIZE)
        ) : (
          // Default screen: calm Breezy icon — no rays until a category is dialed.
          <RollingOrb size={ICON_SIZE} fadeBall={false} rolling={false} />
        )}
      </View>

      {/* Full-circle track: a half-fading ring whose bright head is the handle.
          Idle → auto-rotates; touching → the bright head follows the finger. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.spinner,
          { top: CENTER_Y - SPIN_S / 2, left: CENTER_X - SPIN_S / 2 },
          ringStyle,
        ]}
      >
        <Svg width={SPIN_S} height={SPIN_S}>
          <Defs>
            <LinearGradient id="fadeRing" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#DB533C" stopOpacity={1} />
              <Stop offset="0.5" stopColor="#C78E7D" stopOpacity={0.3} />
              <Stop offset="1" stopColor="#C78E7D" stopOpacity={0.03} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={SPIN_S / 2}
            cy={SPIN_S / 2}
            r={R}
            stroke="url(#fadeRing)"
            strokeWidth={3}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Visible handle on the track */}
      <Animated.View pointerEvents="none" style={[styles.dotHit, ballStyle]}>
        <View style={styles.dotHalo} />
        <View style={styles.dot} />
      </Animated.View>
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
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
  },
  iconArea: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  spinner: {
    position: 'absolute',
    width: SPIN_S,
    height: SPIN_S,
  },
  dialArea: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.01)', // near-invisible but hittable
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
