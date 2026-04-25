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
        {/* Card background — night scene with warm lamp-lit pool at bottom */}
        <RadialGradient
          id="cardBg"
          cx="0.5"
          cy="0.85"
          r="0.95"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#E8D8AA" />
          <Stop offset="0.3" stopColor="#8B7B6E" />
          <Stop offset="0.65" stopColor="#3A4A6E" />
          <Stop offset="1" stopColor="#15233D" />
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

      {/* Liquid contents — clipped to rounded card shape */}
      <G clipPath="url(#cardClip)">
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
