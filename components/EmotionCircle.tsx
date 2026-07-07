import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
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

// Vivid color pairs pulled from the reference — pink, cyan, coral, magenta
const COLOR_PAIRS: Array<[string, string]> = [
  ['#FF2E86', '#00D4D4'], // hot pink → turquoise
  ['#FF2E86', '#FF6633'], // hot pink → coral
  ['#00CFCF', '#FF6633'], // cyan → coral
  ['#88F0C0', '#FF2E86'], // mint → pink
  ['#FF6633', '#00CCE0'], // coral → cyan
  ['#D000B0', '#00E0E0'], // magenta → aqua
  ['#FFB0C0', '#00D4D4'], // soft pink → turquoise
  ['#FF3399', '#FF9944'], // pink → orange
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
    const pair = COLOR_PAIRS[h % COLOR_PAIRS.length];
    // Off-center hotspot for organic variation, roughly matching the reference
    const cx = 0.28 + seededRandom(h * 3.1) * 0.44; // 0.28 – 0.72
    const cy = 0.28 + seededRandom(h * 7.7) * 0.44;
    // Unique id fragment prevents Def collisions across cells
    const idFrag = safeId(label);
    return { pair, cx, cy, idFrag };
  }, [label]);

  const { pair, cx, cy, idFrag } = cellVisuals;
  const [colorA, colorB] = pair;

  const bgGradientId = `bg_${idFrag}`;
  const rimGradientId = `rim_${idFrag}`;
  const clipId = `clip_${idFrag}`;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ width: size, height: size }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        }}
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
      </View>
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
