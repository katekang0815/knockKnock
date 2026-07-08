import { memo, useCallback, useEffect, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Rect,
  Circle,
  Defs,
  ClipPath,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';

interface EmotionCircleProps {
  label: string;
  category: string;
  gradientStart?: string;
  gradientEnd?: string;
  size: number;
  // For focus-driven pop-and-part animation: this cell's global grid position
  // and the shared value tracking which cell is at the viewport center.
  col?: number;
  row?: number;
  focusedCell?: SharedValue<number>;
}

// Pop-and-part tuning
const FOCUS_SCALE = 1.35;
const FOCUS_PUSH_RATIO = 0.175; // = (FOCUS_SCALE - 1) / 2
const FOCUS_ANIM_MS = 220;

// --- Utilities ---

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function hashLabel(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h << 5) - h + label.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Sanitize the label into a legal SVG id fragment (a-z, A-Z, digits, underscore only)
function safeId(label: string): string {
  return label.replace(/[^a-zA-Z0-9]/g, '_');
}

// Shared frost grain positions in 0–100 viewBox space
const FROST_GRAIN = Array.from({ length: 45 }, (_, i) => ({
  x: seededRandom(i * 13) * 100,
  y: seededRandom(i * 17 + 1) * 100,
  r: 0.25 + seededRandom(i * 23 + 2) * 0.7,
  opacity: 0.05 + seededRandom(i * 31 + 3) * 0.15,
  bright: seededRandom(i * 41 + 5) > 0.5,
}));

// Default palette pulled from BouncingBall: coral → dusty rose → cream
// Format: [hotspot (warm/vivid), field (soft/pale)]
const COLOR_PAIRS: Array<[string, string]> = [
  ['#DB533C', '#FFF7CE'], // coral → cream (the ball's own gradient)
  ['#DB533C', '#C78E7D'], // coral → dusty rose
  ['#C78E7D', '#FFF7CE'], // rose → cream
  ['#E56A50', '#FFE8C8'], // soft coral → pale cream
  ['#DB533C', '#F5D5B8'], // coral → warm blush
  ['#C78E7D', '#FFEBC8'], // rose → butter cream
  ['#B84832', '#F0C8B0'], // deep coral → peach
  ['#E88A6E', '#FFF2D8'], // salmon → light cream
];

// Stormy palette — sparse ember pops inside deep steel/slate rain-dark fields.
// Reads as "night storm": mostly cool, brooding tones with rare warm cores flaring through.
const STORMY_PAIRS: Array<[string, string]> = [
  ['#EE4E2E', '#3A5570'], // ember → deep steel
  ['#3A5570', '#EE4E2E'], // deep steel → ember (inverted)
  ['#D64828', '#232D3D'], // deep red → dark navy
  ['#4A6780', '#EE4E2E'], // slate → ember
  ['#5A7590', '#3A5570'], // slate → deep steel (all-cool)
  ['#E85030', '#4A6780'], // warm red → slate
  ['#85A0B0', '#1E2838'], // light gray-blue → near black (all-cool)
  ['#EE4E2E', '#5A7590'], // ember → slate
];

// Breezy palette — vivid hot pink / coral hotspots into clean teal / mint fields.
// Reads as "electric breeze": bright warm-cool play with pink pops and coral blends.
const BREEZY_PAIRS: Array<[string, string]> = [
  ['#FF347F', '#65C4BB'], // vivid hot pink → clean teal
  ['#F26A5A', '#5FBEC0'], // coral → cool teal
  ['#FF5E7A', '#7ED4C8'], // pink → mint
  ['#FF6E4E', '#66BFB8'], // coral orange → teal
  ['#65C4BB', '#FF347F'], // teal → hot pink (cool-dominant)
  ['#7ED4C8', '#F26A5A'], // mint → coral
  ['#E93885', '#7AB5AC'], // magenta → dusty teal
  ['#FF347F', '#5FBEC0'], // hot pink → cool teal
];

// Calm palette — deep forest teal + warm coral / peach on a cream field.
// Reads as "grounded warmth": earthy tones that feel like rain on old wood.
const CALM_PAIRS: Array<[string, string]> = [
  ['#1B5854', '#F0E4CE'], // deep teal → cream
  ['#E5745A', '#1B5854'], // coral → deep teal
  ['#0F4A48', '#E5745A'], // forest → coral
  ['#F0A88C', '#1B5854'], // peach → deep teal
  ['#E85E45', '#F5E8D0'], // warm coral → cream
  ['#0F4A48', '#F0A88C'], // forest → peach
  ['#2A6560', '#E85E45'], // teal green → coral
  ['#E5745A', '#F5E0C8'], // coral → warm cream
];

const LABEL_COLOR = '#FFFFFF';

// Static per-label color overrides — colors copied as literals so they stay put
// even if the source label's palette entry later changes.
const PAIR_OVERRIDE: Record<string, [string, string]> = {
  Excited:    ['#E85E45', '#F5E8D0'], // snapshot of Chill's rendered pair
  Surprised:  ['#E5745A', '#F5E0C8'], // snapshot of Peaceful's rendered pair
  Hopeful:    ['#E5745A', '#F5E0C8'], // snapshot of Content's rendered pair
  Inspired:   ['#E85E45', '#F5E8D0'], // snapshot of Appreciated's rendered pair
  Successful: ['#DB533C', '#FFF7CE'], // snapshot of Happy's rendered pair
  Thrilled:   ['#DB533C', '#F5D5B8'], // snapshot of Amazed's rendered pair
  Focused:    ['#E5745A', '#F5E0C8'], // snapshot of Hopeful's rendered pair
  Frustrated: ['#E85030', '#8595A5'], // snapshot of Sad's rendered pair
  Nervous:    ['#6A8098', '#EE4E2E'], // snapshot of Tired's rendered pair
  Irritated:  ['#4A6B8A', '#EE4E2E'], // snapshot of Down's rendered pair
  Annoyed:    ['#4A6B8A', '#EE4E2E'], // snapshot of Disappointed's rendered pair
  Worried:    ['#E85030', '#7A8A9B'], // snapshot of Lonely's rendered pair
  // Breezy internal transplants — copy of another Breezy label's rendered pair.
  Chill:       ['#FF5E7A', '#7ED4C8'], // snapshot of Loved's rendered pair
  Grateful:    ['#7ED4C8', '#F26A5A'], // snapshot of Good's rendered pair
  Peaceful:    ['#F26A5A', '#5FBEC0'], // snapshot of Relaxed's rendered pair
  Comfortable: ['#7ED4C8', '#F26A5A'], // snapshot of Safe's rendered pair
  Content:     ['#FF6E4E', '#66BFB8'], // snapshot of Thankful's rendered pair
  Appreciated: ['#F26A5A', '#5FBEC0'], // snapshot of Connected's rendered pair
  Relieved:    ['#FF6E4E', '#66BFB8'], // snapshot of Understood's rendered pair
  Supported:   ['#FF5E7A', '#7ED4C8'], // reuses Loved's pair (8 targets vs 7 sources)
  // Calm internal transplants — copy of another Calm label's rendered pair.
  Tired:       ['#2A6560', '#E85E45'], // snapshot of Sad's rendered pair
  Bored:       ['#E5745A', '#1B5854'], // snapshot of Lonely's rendered pair
  Exhausted:   ['#0F4A48', '#E5745A'], // snapshot of Down's rendered pair
  Lost:        ['#E5745A', '#1B5854'], // snapshot of Depressed's rendered pair
  Insecure:    ['#0F4A48', '#E5745A'], // snapshot of Disappointed's rendered pair
  Numb:        ['#E5745A', '#1B5854'], // snapshot of Ashamed's rendered pair
  'Burned Out':['#2A6560', '#E85E45'], // snapshot of Guilty's rendered pair
  Meh:         ['#0F4A48', '#E5745A'], // snapshot of Down's rendered pair
  Vulnerable:  ['#2A6560', '#E85E45'], // snapshot of Sad's rendered pair
};

function EmotionCircleComponent({
  label,
  category,
  size,
  col,
  row,
  focusedCell,
}: EmotionCircleProps) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/emotionlog',
      params: { emotion: label, category },
    });
  }, [label, category]);

  const labelColor = LABEL_COLOR;

  // Deterministic per-cell visuals: color pair + gradient hotspot position + id suffix.
  // Each label uses its own hash + its own category palette; a few labels have literal overrides.
  const cellVisuals = useMemo(() => {
    const h = hashLabel(label);
    // Per-category palettes; Sunny falls back to the default warm coral set.
    const palette =
      category === 'Stormy' ? STORMY_PAIRS :
      category === 'Breezy' ? BREEZY_PAIRS :
      category === 'Calm'   ? CALM_PAIRS :
      COLOR_PAIRS;
    const pair = PAIR_OVERRIDE[label] ?? palette[h % palette.length];
    // Off-center hotspot for organic variation, roughly matching the reference
    const cx = 0.28 + seededRandom(h * 3.1) * 0.44; // 0.28 – 0.72
    const cy = 0.28 + seededRandom(h * 7.7) * 0.44;
    // Unique id fragment prevents Def collisions across cells
    const idFrag = safeId(label);
    return { pair, cx, cy, idFrag };
  }, [label, category]);

  const { pair, cx, cy, idFrag } = cellVisuals;
  const [colorA, colorB] = pair;

  const bgGradientId = `bg_${idFrag}`;
  const rimGradientId = `rim_${idFrag}`;
  const clipId = `clip_${idFrag}`;

  // Idle motion — all cells jitter like the Stormy temperament for now.
  const idleAnim = useSharedValue(0);
  useEffect(() => {
    // Stagger by hash so cells don't all move in sync.
    const phase = seededRandom(hashLabel(label) * 5.7) * 1000;
    idleAnim.value = withDelay(
      phase,
      withRepeat(
        withTiming(1, { duration: 800, easing: Easing.linear }),
        -1,
        true,
      ),
    );
  }, [label]);

  // Pop-and-part shared values: driven by useAnimatedReaction below.
  const focusScale = useSharedValue(1);
  const focusPushX = useSharedValue(0);
  const focusPushY = useSharedValue(0);

  useAnimatedReaction(
    () => focusedCell?.value ?? -1,
    (fc) => {
      if (fc === -1 || col === undefined || row === undefined) return;
      const fcol = Math.floor(fc / 10000);
      const frow = fc % 10000;
      const isFocused = fcol === col && frow === row;
      const delta = FOCUS_PUSH_RATIO * size;
      focusScale.value = withTiming(isFocused ? FOCUS_SCALE : 1, { duration: FOCUS_ANIM_MS });
      focusPushX.value = withTiming(isFocused ? 0 : Math.sign(col - fcol) * delta, { duration: FOCUS_ANIM_MS });
      focusPushY.value = withTiming(isFocused ? 0 : Math.sign(row - frow) * delta, { duration: FOCUS_ANIM_MS });
    },
    [col, row, size],
  );

  const idleStyle = useAnimatedStyle(() => {
    const t = idleAnim.value;
    const phi = t * Math.PI * 2;
    const jitterX = (Math.sin(phi * 3) + Math.sin(phi * 5.3)) * 0.5;
    const jitterY = Math.cos(phi * 4.1) * 0.4;
    return {
      transform: [
        { translateX: jitterX + focusPushX.value },
        { translateY: jitterY + focusPushY.value },
        { scale: focusScale.value },
      ],
    };
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
          idleStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <ClipPath id={clipId}>
              <Rect x={0} y={0} width={100} height={100} rx={50} />
            </ClipPath>
            {/* Bright vivid radial: hotspot color at cx/cy fading to the second color */}
            <RadialGradient
              id={bgGradientId}
              cx={cx.toString()}
              cy={cy.toString()}
              r="0.85"
              gradientUnits="objectBoundingBox"
            >
              <Stop offset="0" stopColor={colorA} />
              <Stop offset="0.65" stopColor={colorB} />
              <Stop offset="1" stopColor={colorB} />
            </RadialGradient>
            {/* Soft rim highlight — a hint of shine at the edge */}
            <RadialGradient
              id={rimGradientId}
              cx="0.5"
              cy="0.5"
              r="0.75"
              gradientUnits="objectBoundingBox"
            >
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="0.85" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.25} />
            </RadialGradient>
          </Defs>

          {/* Base vivid gradient */}
          <Rect x={0} y={0} width={100} height={100} rx={50} fill={`url(#${bgGradientId})`} />

          {/* Subtle grain texture to keep the "matte marble" feel */}
          <G clipPath={`url(#${clipId})`}>
            {FROST_GRAIN.map((g, i) => (
              <Circle
                key={i}
                cx={g.x}
                cy={g.y}
                r={g.r}
                fill={g.bright ? '#FFFFFF' : '#000000'}
                opacity={g.opacity}
              />
            ))}
          </G>

          {/* Bright edge sheen */}
          <Rect x={0} y={0} width={100} height={100} rx={50} fill={`url(#${rimGradientId})`} />
        </Svg>

        {/* Label overlay */}
        <View style={styles.labelContainer}>
          <Text
            style={[styles.label, { fontSize: size * 0.14, color: labelColor }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default memo(EmotionCircleComponent);

const styles = StyleSheet.create({
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  label: {
    fontFamily: 'Jost_400Regular',
    textAlign: 'center',
    // Soft dark drop for legibility over vivid gradients
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
