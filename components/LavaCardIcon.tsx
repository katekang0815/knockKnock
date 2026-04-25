import { useEffect } from 'react';
import Svg, {
  Path,
  Circle,
  Defs,
  ClipPath,
  G,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  size: number;
  borderRadius?: number;
}

// Deterministic seeded random for consistent frost texture
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// Pre-compute grainy frost particles distributed across the whole card
const FROST_GRAIN = Array.from({ length: 140 }, (_, i) => ({
  x: seededRandom(i * 13) * 100,
  y: seededRandom(i * 17 + 1) * 100,
  r: 0.18 + seededRandom(i * 23 + 2) * 0.55,
  opacity: 0.07 + seededRandom(i * 31 + 3) * 0.28,
}));

/**
 * Generate an organic blob path using sine-perturbed polar coordinates.
 * Smooth closed curve via quadratic Bezier through midpoints.
 */
function makeBlob(
  cx: number,
  cy: number,
  baseR: number,
  time: number,
  seed: number,
): string {
  'worklet';
  const N = 12;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2;
    const noise =
      Math.sin(time * 1.0 + angle * 3 + seed) * 0.20 +
      Math.cos(time * 0.7 + angle * 2 + seed * 1.5) * 0.13 +
      Math.sin(time * 1.3 + angle * 5 + seed * 0.7) * 0.07;
    const r = baseR * (1 + noise);
    xs.push(cx + Math.cos(angle) * r);
    ys.push(cy + Math.sin(angle) * r);
  }
  const startMidX = (xs[N - 1] + xs[0]) / 2;
  const startMidY = (ys[N - 1] + ys[0]) / 2;
  let d = `M ${startMidX.toFixed(2)} ${startMidY.toFixed(2)} `;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const midX = (xs[i] + xs[j]) / 2;
    const midY = (ys[i] + ys[j]) / 2;
    d += `Q ${xs[i].toFixed(2)} ${ys[i].toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)} `;
  }
  d += 'Z';
  return d;
}

export default function LavaCardIcon({ size, borderRadius = 24 }: Props) {
  const liquidT = useSharedValue(0);

  useEffect(() => {
    liquidT.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // Lava blobs concentrated near the bottom of the card (warm hot spot)
  const blob1Props = useAnimatedProps(() => {
    const cy = 78 + 8 * Math.sin(liquidT.value * 1.0);
    const r = 16 + 2.5 * Math.cos(liquidT.value * 1.3);
    return { d: makeBlob(50, cy, r, liquidT.value, 0.5) };
  });

  const blob2Props = useAnimatedProps(() => {
    const cy = 60 + 12 * Math.sin(liquidT.value * 0.7 + 1.5);
    const r = 9 + 2 * Math.cos(liquidT.value * 0.9 + 0.5);
    return { d: makeBlob(63, cy, r, liquidT.value * 0.9, 2.1) };
  });

  const blob3Props = useAnimatedProps(() => {
    const cy = 48 + 10 * Math.sin(liquidT.value * 1.4 + 3);
    const r = 6 + 1.5 * Math.cos(liquidT.value * 1.1 + 2);
    return { d: makeBlob(38, cy, r, liquidT.value * 1.2, 4.0) };
  });

  const blob4Props = useAnimatedProps(() => {
    const cy = 70 + 6 * Math.sin(liquidT.value * 0.8 + 4);
    const r = 5 + 1 * Math.cos(liquidT.value * 1.5 + 1);
    return { d: makeBlob(72, cy, r, liquidT.value * 1.4, 5.7) };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="cardClip">
          <Rect x={0} y={0} width={100} height={100} rx={borderRadius} />
        </ClipPath>
        {/* Card background — starry night sky in a jar */}
        <RadialGradient
          id="cardBg"
          cx="0.5"
          cy="0.5"
          r="0.85"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#1A1A2E" />
          <Stop offset="0.5" stopColor="#0A0A18" />
          <Stop offset="1" stopColor="#000000" />
        </RadialGradient>
        {/* Frost glass edge — inverse vignette: transparent at center, bright at edges */}
        <RadialGradient
          id="frostEdge"
          cx="0.5"
          cy="0.5"
          r="0.75"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#9BA8C0" stopOpacity={0} />
          <Stop offset="0.6" stopColor="#9BA8C0" stopOpacity={0} />
          <Stop offset="0.85" stopColor="#A8B5CC" stopOpacity={0.18} />
          <Stop offset="1" stopColor="#C0CCE0" stopOpacity={0.4} />
        </RadialGradient>
        {/* Lava blob gradient */}
        <RadialGradient
          id="blobGrad"
          cx="0.5"
          cy="0.5"
          r="0.5"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="0.4" stopColor="#F8E16C" stopOpacity={1} />
          <Stop offset="1" stopColor="#F5C842" stopOpacity={0.85} />
        </RadialGradient>
      </Defs>

      {/* Background — full card with rounded corners */}
      <Rect
        x={0}
        y={0}
        width={100}
        height={100}
        rx={borderRadius}
        fill="url(#cardBg)"
      />

      {/* Frost glass vignette — bright soft edge */}
      <Rect
        x={0}
        y={0}
        width={100}
        height={100}
        rx={borderRadius}
        fill="url(#frostEdge)"
      />

      {/* Frost rim — visible glass edge */}
      <Rect
        x={0.6}
        y={0.6}
        width={98.8}
        height={98.8}
        rx={borderRadius - 0.6}
        fill="none"
        stroke="#C0CCE0"
        strokeWidth={0.8}
        strokeOpacity={0.5}
      />

      {/* Liquid contents — clipped to rounded card shape */}
      <G clipPath="url(#cardClip)">
        {/* Grainy frost texture covering the whole card */}
        {FROST_GRAIN.map((g, i) => (
          <Circle
            key={`grain-${i}`}
            cx={g.x}
            cy={g.y}
            r={g.r}
            fill="#C5D0E5"
            opacity={g.opacity}
          />
        ))}

        {/* Floating particles distributed across the card */}
        <Circle cx={20} cy={22} r={0.7} fill="#FFF5DD" opacity={0.45} />
        <Circle cx={32} cy={32} r={0.5} fill="#FFF5DD" opacity={0.4} />
        <Circle cx={50} cy={18} r={0.8} fill="#FFF5DD" opacity={0.5} />
        <Circle cx={68} cy={28} r={0.6} fill="#FFF5DD" opacity={0.45} />
        <Circle cx={82} cy={20} r={0.5} fill="#FFF5DD" opacity={0.4} />
        <Circle cx={15} cy={48} r={0.6} fill="#FFF5DD" opacity={0.4} />
        <Circle cx={86} cy={50} r={0.6} fill="#FFF5DD" opacity={0.4} />
        <Circle cx={28} cy={62} r={0.7} fill="#FFF5DD" opacity={0.45} />
        <Circle cx={78} cy={68} r={0.5} fill="#FFF5DD" opacity={0.4} />
        <Circle cx={45} cy={40} r={0.5} fill="#FFF5DD" opacity={0.35} />

        {/* Lava blobs — organic morphing paths */}
        <AnimatedPath animatedProps={blob1Props} fill="url(#blobGrad)" />
        <AnimatedPath animatedProps={blob2Props} fill="url(#blobGrad)" />
        <AnimatedPath animatedProps={blob3Props} fill="url(#blobGrad)" />
        <AnimatedPath animatedProps={blob4Props} fill="url(#blobGrad)" />
      </G>
    </Svg>
  );
}
