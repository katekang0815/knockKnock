import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  Defs,
  ClipPath,
  G,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const HEAD_COLOR = '#F5E8C8';
const BODY_PATH = 'M 28 30 L 88.75 30 L 281.125 343.875 L 28 343.875 Z';
const LIQUID_GLOW = '#FFB69E';

const VIEW_W = 295;
const VIEW_H = 370;

interface Props {
  size: number;
}

function footPosition(phase: number) {
  'worklet';
  if (phase < 0.5) {
    const p = phase * 2;
    return { x: -8 + 16 * p, y: 0 };
  } else {
    const p = (phase - 0.5) * 2;
    return { x: 8 - 16 * p, y: -5 * Math.sin(p * Math.PI) };
  }
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
  // Build smooth closed path using quadratic Bezier through midpoints
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

export default function WalkingIcon({ size }: Props) {
  const t = useSharedValue(0);
  const liquidT = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
    liquidT.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const scale = size / VIEW_W;

  const upperBodyStyle = useAnimatedStyle(() => {
    const bobY = -2.5 * Math.abs(Math.sin(t.value * 2 * Math.PI));
    return { transform: [{ translateY: bobY * scale }] };
  });

  const foot1Style = useAnimatedStyle(() => {
    const { x, y } = footPosition(t.value % 1);
    return { transform: [{ translateX: x * scale }, { translateY: y * scale }] };
  });

  const foot2Style = useAnimatedStyle(() => {
    const { x, y } = footPosition((t.value + 0.5) % 1);
    return { transform: [{ translateX: x * scale }, { translateY: y * scale }] };
  });

  // Lava blobs — organic morphing shapes (positions/sizes scaled 1.5x with body)
  const blob1Props = useAnimatedProps(() => {
    const cy = 239.25 + 74.25 * Math.sin(liquidT.value * 1.0);
    const r = 37.125 + 6.75 * Math.cos(liquidT.value * 1.3);
    return { d: makeBlob(100, cy, r, liquidT.value, 0.5) };
  });

  const blob2Props = useAnimatedProps(() => {
    const cy = 205.5 + 94.5 * Math.sin(liquidT.value * 0.7 + 1.5);
    const r = 27 + 6.75 * Math.cos(liquidT.value * 0.9 + 0.5);
    return { d: makeBlob(156.25, cy, r, liquidT.value * 0.9, 2.1) };
  });

  const blob3Props = useAnimatedProps(() => {
    const cy = 171.75 + 60.75 * Math.sin(liquidT.value * 1.4 + 3);
    const r = 20.25 + 5.0625 * Math.cos(liquidT.value * 1.1 + 2);
    return { d: makeBlob(77.5, cy, r, liquidT.value * 1.2, 4.0) };
  });

  const blob4Props = useAnimatedProps(() => {
    const cy = 273 + 49.5 * Math.sin(liquidT.value * 0.8 + 4);
    const r = 16.875 + 3.375 * Math.cos(liquidT.value * 1.5 + 1);
    return { d: makeBlob(178.75, cy, r, liquidT.value * 1.4, 5.7) };
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Upper body (head + lava lamp) — bobs up and down */}
      <Animated.View style={[StyleSheet.absoluteFill, upperBodyStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <Defs>
            <ClipPath id="bodyClip">
              <Path d={BODY_PATH} />
            </ClipPath>
            <RadialGradient
              id="blobGrad"
              cx="0.5"
              cy="0.5"
              r="0.5"
              gradientUnits="objectBoundingBox"
            >
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="0.4" stopColor="#F8E16C" stopOpacity={1} />
              <Stop offset="1" stopColor="#F5C842" stopOpacity={0.8} />
            </RadialGradient>
            <RadialGradient
              id="bgGlow"
              cx="0.5"
              cy="0.6"
              r="0.6"
              gradientUnits="objectBoundingBox"
            >
              <Stop offset="0" stopColor={LIQUID_GLOW} stopOpacity={0.5} />
              <Stop offset="1" stopColor={LIQUID_GLOW} stopOpacity={0.1} />
            </RadialGradient>
          </Defs>

          {/* Head */}
          <Circle cx={22} cy={22} r={6} fill={HEAD_COLOR} />

          {/* Liquid contents — clipped to body shape (no body outline) */}
          <G clipPath="url(#bodyClip)">
            <Path d={BODY_PATH} fill="url(#bgGlow)" />

            {/* Particles */}
            <Circle cx={59.5} cy={138} r={2.7} fill="#FFF5DD" opacity={0.6} />
            <Circle cx={100} cy={188.625} r={1.8} fill="#FFF5DD" opacity={0.5} />
            <Circle cx={77.5} cy={87.375} r={1.575} fill="#FFF5DD" opacity={0.4} />
            <Circle cx={122.5} cy={306.75} r={2.25} fill="#FFF5DD" opacity={0.5} />
            <Circle cx={66.25} cy={289.875} r={2.025} fill="#FFF5DD" opacity={0.4} />
            <Circle cx={145} cy={239.25} r={1.35} fill="#FFF5DD" opacity={0.5} />

            {/* Lava blobs — organic morphing paths */}
            <AnimatedPath animatedProps={blob1Props} fill="url(#blobGrad)" />
            <AnimatedPath animatedProps={blob2Props} fill="url(#blobGrad)" />
            <AnimatedPath animatedProps={blob3Props} fill="url(#blobGrad)" />
            <AnimatedPath animatedProps={blob4Props} fill="url(#blobGrad)" />
          </G>
        </Svg>
      </Animated.View>

      {/* Foot 1 */}
      <Animated.View style={[StyleSheet.absoluteFill, foot1Style]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <Ellipse
            cx={38}
            cy={355.875}
            rx={5}
            ry={1.8}
            fill={HEAD_COLOR}
            transform="rotate(-20 38 355.875)"
          />
        </Svg>
      </Animated.View>

      {/* Foot 2 */}
      <Animated.View style={[StyleSheet.absoluteFill, foot2Style]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <Ellipse
            cx={54}
            cy={355.875}
            rx={5}
            ry={1.8}
            fill={HEAD_COLOR}
            transform="rotate(-20 54 355.875)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
