import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  Line,
  LinearGradient,
  Stop,
  Circle as SvgCircle,
  Path as SvgPath,
} from "react-native-svg";

interface Props {
  size: number;
}

// Stair positions as fractions of the container
// Staggered diagonally: bottom-left → top-right
const STAIRS = [
  { x: 0.05, y: 0.82, w: 0.22 }, // stair 1 (far left)
  { x: 0.35, y: 0.55, w: 0.22 }, // stair 2 (center)
  { x: 0.68, y: 0.28, w: 0.22 }, // stair 3 (far right)
];

// Ball positions (on stair surfaces)
const BALL_SIZE_FRAC = 0.18;
const POSITIONS = [
  { x: 0.10, y: 0.92 }, // ground (below stair 1)
  { x: 0.16, y: 0.76 }, // on stair 1
  { x: 0.46, y: 0.49 }, // on stair 2
  { x: 0.78, y: 0.22 }, // on stair 3
  { x: 0.90, y: 0.02 }, // above stair 3 (disappear)
];

export default function BouncingBall({ size }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(4, { duration: 5000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // Shared position helpers
  const ballR = BALL_SIZE_FRAC * size;
  const glowSize = ballR * 1.25;

  const ballStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const x = interpolate(p, [0, 1, 2, 3, 4], [
      POSITIONS[0].x * size, POSITIONS[1].x * size, POSITIONS[2].x * size, POSITIONS[3].x * size, POSITIONS[4].x * size,
    ]);
    const y = interpolate(p, [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.2, 3.5, 3.75, 3.9, 4], [
      POSITIONS[0].y * size, (POSITIONS[0].y - 0.50) * size,
      POSITIONS[1].y * size, (POSITIONS[1].y - 0.50) * size,
      POSITIONS[2].y * size, (POSITIONS[2].y - 0.50) * size,
      POSITIONS[3].y * size, (POSITIONS[3].y - 0.18) * size,
      (POSITIONS[3].y - 0.27) * size, (POSITIONS[3].y - 0.22) * size,
      (POSITIONS[3].y - 0.08) * size, POSITIONS[3].y * size,
    ]);
    const xFinal = interpolate(p, [3, 3.2, 3.5, 3.75, 4], [
      POSITIONS[3].x * size, (POSITIONS[3].x + 0.06) * size, (POSITIONS[3].x + 0.13) * size,
      (POSITIONS[3].x + 0.19) * size, (POSITIONS[3].x + 0.24) * size,
    ]);
    const xPos = p >= 3 ? xFinal : x;
    const opacity = interpolate(p, [0, 3, 3.4, 4], [1, 1, 0.5, 0]);
    return {
      position: 'absolute' as const,
      left: xPos - ballR / 2,
      top: y - ballR / 2,
      width: ballR,
      height: ballR,
      opacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const x = interpolate(p, [0, 1, 2, 3, 4], [
      POSITIONS[0].x * size, POSITIONS[1].x * size, POSITIONS[2].x * size, POSITIONS[3].x * size, POSITIONS[4].x * size,
    ]);
    const y = interpolate(p, [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.2, 3.5, 3.75, 3.9, 4], [
      POSITIONS[0].y * size, (POSITIONS[0].y - 0.50) * size,
      POSITIONS[1].y * size, (POSITIONS[1].y - 0.50) * size,
      POSITIONS[2].y * size, (POSITIONS[2].y - 0.50) * size,
      POSITIONS[3].y * size, (POSITIONS[3].y - 0.18) * size,
      (POSITIONS[3].y - 0.27) * size, (POSITIONS[3].y - 0.22) * size,
      (POSITIONS[3].y - 0.08) * size, POSITIONS[3].y * size,
    ]);
    const xFinal = interpolate(p, [3, 3.2, 3.5, 3.75, 4], [
      POSITIONS[3].x * size, (POSITIONS[3].x + 0.06) * size, (POSITIONS[3].x + 0.13) * size,
      (POSITIONS[3].x + 0.19) * size, (POSITIONS[3].x + 0.24) * size,
    ]);
    const xPos = p >= 3 ? xFinal : x;
    const ballOpacity = interpolate(p, [0, 3, 3.4, 4], [1, 1, 0.5, 0]);
    const glowOpacity = p < 1 ? 0 : p >= 3 ? 0.7 : 0.5;
    return {
      position: 'absolute' as const,
      left: xPos - glowSize / 2,
      top: y - glowSize / 2,
      width: glowSize,
      height: glowSize,
      borderRadius: glowSize / 2,
      opacity: glowOpacity * ballOpacity,
    };
  });

  // Ball visual state derived from progress
  const visualPhase = useDerivedValue(() => Math.floor(progress.value));

  return (
    <View style={{ width: size, height: size }}>
      {/* Static stairs */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {STAIRS.map((stair, i) => (
          <Line
            key={i}
            x1={stair.x * size}
            y1={stair.y * size}
            x2={(stair.x + stair.w) * size}
            y2={stair.y * size}
            stroke="#FFFFFF"
            strokeWidth={0.5}
            strokeLinecap="round"
          />
        ))}
      </Svg>

      {/* Glow layer behind the ball — concentric rings fading outward */}
      <Animated.View style={glowStyle}>
        {[1, 0.85, 0.7, 0.55, 0.4].map((scale, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: glowSize * (1 - scale) / 2,
              top: glowSize * (1 - scale) / 2,
              width: glowSize * scale,
              height: glowSize * scale,
              borderRadius: (glowSize * scale) / 2,
              backgroundColor: '#E8CFA0',
              opacity: i === 4 ? 1 : (4 - i) * 0.15,
              shadowColor: '#E8CFA0',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: (4 - i) * 0.2,
              shadowRadius: (4 - i) * 4,
            }}
          />
        ))}
      </Animated.View>

      {/* Animated ball */}
      <Animated.View style={ballStyle}>
        {/* Phase 0: Empty outline */}
        <BallPhase phase={0} currentPhase={visualPhase} size={ballR} />
        {/* Phase 1: Gradient fill */}
        <BallPhase phase={1} currentPhase={visualPhase} size={ballR} />
        {/* Phase 2: Glowing ball */}
        <BallPhase phase={2} currentPhase={visualPhase} size={ballR} />
        {/* Phase 3: Star shape */}
        <BallPhase phase={3} currentPhase={visualPhase} size={ballR} />
      </Animated.View>
    </View>
  );
}

function BallPhase({
  phase,
  currentPhase,
  size,
}: {
  phase: number;
  currentPhase: Animated.SharedValue<number>;
  size: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: currentPhase.value === phase ? 1 : 0,
  }));

  const r = size / 2;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="warmGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#E8CFA0" />
            <Stop offset="1" stopColor="#C8887A" />
          </LinearGradient>
          <LinearGradient id="starGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#E8654A" />
            <Stop offset="0.5" stopColor="#E8956A" />
            <Stop offset="1" stopColor="#F0C888" />
          </LinearGradient>
        </Defs>

        {phase === 0 && (
          <SvgCircle
            cx={r}
            cy={r}
            r={r * 0.7}
            fill="url(#warmGrad)"
          />
        )}

        {phase === 1 && (
          <SvgCircle
            cx={r}
            cy={r}
            r={r * 0.7}
            fill="url(#warmGrad)"
          />
        )}

        {phase === 2 && (
          <SvgCircle
            cx={r}
            cy={r}
            r={r * 0.7}
            fill="url(#warmGrad)"
          />
        )}

        {phase === 3 && <StarShape cx={r} cy={r} size={r * 3.2} />}
      </Svg>
    </Animated.View>
  );
}

function StarShape({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const outer = size * 0.5;
  const inner = size * 0.06;
  let d = "";
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * i) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)} `;
  }
  return <SvgPath d={d + "Z"} fill="url(#starGrad)" stroke="#E8654A" strokeWidth={1} />;
}
