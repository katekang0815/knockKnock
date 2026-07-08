import { memo, useCallback, useEffect, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
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
}

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

// Stormy palette — hot pink / magenta hotspots fading into cool teal / mint fields.
// Reads as "electric tension": warm and cool colors colliding on each cell.
const STORMY_PAIRS: Array<[string, string]> = [
  ['#FF3E7C', '#6ABDB6'], // hot pink → teal
  ['#F7476D', '#5FBEC0'], // rose → cool teal
  ['#FF547A', '#7EC6BE'], // pink → mint
  ['#E63E7A', '#66BFB8'], // magenta → teal
  ['#FF6E4E', '#FF3E7C'], // coral → pink (warm-dominant)
  ['#66BFB8', '#FF3E7C'], // teal → pink (cool-dominant)
  ['#F26A5A', '#66BFB8'], // coral → teal
  ['#FF3E7C', '#A88EA0'], // pink → dusty lavender
];

// Breezy palette — deep forest teal + warm coral / peach, on a cream field.
// Reads as "grounded warmth": earthier and softer than Stormy's electric pop.
const BREEZY_PAIRS: Array<[string, string]> = [
  ['#1B5854', '#F0E4CE'], // deep teal → cream
  ['#E5745A', '#1B5854'], // coral → deep teal
  ['#0F4A48', '#E5745A'], // forest → coral
  ['#F0A88C', '#1B5854'], // peach → deep teal
  ['#E85E45', '#F5E8D0'], // warm coral → cream
  ['#0F4A48', '#F0A88C'], // forest → peach
  ['#2A6560', '#E85E45'], // teal green → coral
  ['#E5745A', '#F5E0C8'], // coral → warm cream
];

// Calm palette — glowing red-orange embers inside cool steel-blue rain.
// Reads as "warmth remembered in a cold storm": small heat cores in cool fields.
const CALM_PAIRS: Array<[string, string]> = [
  ['#EE4E2E', '#5A7A9B'], // ember → steel blue
  ['#E85030', '#7A8A9B'], // warm red → slate
  ['#4A6B8A', '#EE4E2E'], // steel → ember
  ['#D64828', '#4A6580'], // deep red → deep steel
  ['#6A8098', '#EE4E2E'], // slate → ember
  ['#5A7A9B', '#2A3A4E'], // steel → dark navy
  ['#E85030', '#8595A5'], // warm red → cool gray
  ['#EE4E2E', '#3E5670'], // ember → deep steel
];

const LABEL_COLOR = '#FFFFFF';

function EmotionCircleComponent({
  label,
  category,
  size,
}: EmotionCircleProps) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/emotionlog',
      params: { emotion: label, category },
    });
  }, [label, category]);

  const labelColor = LABEL_COLOR;

  // Deterministic per-cell visuals: color pair + gradient hotspot position + id suffix
  const cellVisuals = useMemo(() => {
    const h = hashLabel(label);
    // Per-category palettes; Sunny falls back to the default warm coral set.
    const palette =
      category === 'Stormy' ? STORMY_PAIRS :
      category === 'Breezy' ? BREEZY_PAIRS :
      category === 'Calm'   ? CALM_PAIRS :
      COLOR_PAIRS;
    const pair = palette[h % palette.length];
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

  const idleStyle = useAnimatedStyle(() => {
    const t = idleAnim.value;
    const phi = t * Math.PI * 2;
    return {
      transform: [
        { translateX: (Math.sin(phi * 3) + Math.sin(phi * 5.3)) * 0.5 },
        { translateY: Math.cos(phi * 4.1) * 0.4 },
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
