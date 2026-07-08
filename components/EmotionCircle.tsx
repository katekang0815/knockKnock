import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, {
  Rect,
  Circle,
  Path,
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

// --- Sunny shape variants ---
// All paths render inside the 0-100 viewBox, centered at (50, 50).
function scallopedPath(bumps: number, r: number, amp: number): string {
  const N = 200;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const radius = r + Math.sin(t * bumps) * amp;
    const x = 50 + Math.cos(t) * radius;
    const y = 50 + Math.sin(t) * radius;
    d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return d + 'Z';
}

function spikyStarPath(points: number, outerR: number, innerR: number): string {
  const total = points * 2;
  let d = '';
  for (let i = 0; i < total; i++) {
    const t = (i / total) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? outerR : innerR;
    const x = 50 + Math.cos(t) * rr;
    const y = 50 + Math.sin(t) * rr;
    d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return d + 'Z';
}

function circleSubPath(cx: number, cy: number, r: number): string {
  return `M ${(cx + r).toFixed(2)},${cy.toFixed(2)} A ${r},${r} 0 1,1 ${(cx - r).toFixed(2)},${cy.toFixed(2)} A ${r},${r} 0 1,1 ${(cx + r).toFixed(2)},${cy.toFixed(2)} Z `;
}

function flowerPath(petals: number, petalR: number, distFromCenter: number, centerR: number): string {
  let d = circleSubPath(50, 50, centerR);
  for (let i = 0; i < petals; i++) {
    const t = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const cx = 50 + Math.cos(t) * distFromCenter;
    const cy = 50 + Math.sin(t) * distFromCenter;
    d += circleSubPath(cx, cy, petalR);
  }
  return d;
}

const SUNNY_SHAPES: string[] = [
  scallopedPath(22, 42, 5),         // gear / scalloped
  spikyStarPath(12, 48, 20),        // spiky sun
  flowerPath(5, 22, 22, 18),        // 5-petal flower
  flowerPath(8, 15, 28, 16),        // 8-petal daisy
  spikyStarPath(4, 48, 8),          // 4-ray asterisk
  flowerPath(4, 24, 24, 20),        // 4-petal rounded
];

// Palette pulled from BouncingBall: coral → dusty rose → cream
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

  // Deterministic per-cell visuals: color pair + gradient hotspot position + id suffix + optional shape
  const cellVisuals = useMemo(() => {
    const h = hashLabel(label);
    const pair = COLOR_PAIRS[h % COLOR_PAIRS.length];
    // Off-center hotspot for organic variation, roughly matching the reference
    const cx = 0.28 + seededRandom(h * 3.1) * 0.44; // 0.28 – 0.72
    const cy = 0.28 + seededRandom(h * 7.7) * 0.44;
    // Unique id fragment prevents Def collisions across cells
    const idFrag = safeId(label);
    // Sunny gets shape variation; other categories stay circles
    const shapeD = category === 'Sunny'
      ? SUNNY_SHAPES[h % SUNNY_SHAPES.length]
      : null;
    return { pair, cx, cy, idFrag, shapeD };
  }, [label, category]);

  const { pair, cx, cy, idFrag, shapeD } = cellVisuals;
  const [colorA, colorB] = pair;
  const isCustomShape = shapeD !== null;

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
          borderRadius: isCustomShape ? 0 : size / 2,
          overflow: 'hidden',
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <ClipPath id={clipId}>
              {isCustomShape ? (
                <Path d={shapeD as string} />
              ) : (
                <Rect x={0} y={0} width={100} height={100} rx={50} />
              )}
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

          {/* Base gradient fill — circle or Sunny custom shape */}
          {isCustomShape ? (
            <Path d={shapeD as string} fill={`url(#${bgGradientId})`} />
          ) : (
            <Rect x={0} y={0} width={100} height={100} rx={50} fill={`url(#${bgGradientId})`} />
          )}

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
          {isCustomShape ? (
            <Path d={shapeD as string} fill={`url(#${rimGradientId})`} />
          ) : (
            <Rect x={0} y={0} width={100} height={100} rx={50} fill={`url(#${rimGradientId})`} />
          )}
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
