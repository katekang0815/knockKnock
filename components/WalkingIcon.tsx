import { useEffect } from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

const STROKE = '#FFFFFF';
const HEAD_COLOR = '#F5E8C8';

interface Props {
  size: number;
}

/**
 * Walking-left cycle (body-frame). One full gait cycle = 1100ms.
 *
 * - Plant phase (0 → 0.5): foot stays on ground, drifts back as body moves left.
 * - Swing phase (0.5 → 1): foot lifts up, arcs forward to plant ahead.
 * - Two feet are offset by 0.5 — one swings while the other plants.
 * - Upper body (head + triangle) bobs up at t=0.25 & t=0.75 (when feet pass each
 *   other / supporting leg is vertical), and dips back to baseline at t=0 & t=0.5
 *   (full stride).
 */
function footPosition(phase: number) {
  'worklet';
  if (phase < 0.5) {
    // Planted — drift from front (-8) to back (+8)
    const p = phase * 2;
    return { x: -8 + 16 * p, y: 0 };
  } else {
    // Swing — arc from back (+8) to front (-8) with vertical lift
    const p = (phase - 0.5) * 2;
    return { x: 8 - 16 * p, y: -5 * Math.sin(p * Math.PI) };
  }
}

export default function WalkingIcon({ size }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const foot1Props = useAnimatedProps(() => {
    const { x, y } = footPosition(t.value % 1);
    return { transform: `translate(${x}, ${y})` };
  });

  const foot2Props = useAnimatedProps(() => {
    const { x, y } = footPosition((t.value + 0.5) % 1);
    return { transform: `translate(${x}, ${y})` };
  });

  // Upper body bob — rises when supporting leg is vertical (feet pass), dips at full stride
  const upperBodyProps = useAnimatedProps(() => {
    const bobY = -2.5 * Math.abs(Math.sin(t.value * 2 * Math.PI));
    return { transform: `translate(0, ${bobY})` };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      {/* Upper body (head + triangle) bobs together */}
      <AnimatedG animatedProps={upperBodyProps}>
        <Circle cx={32} cy={22} r={7} fill={HEAD_COLOR} />
        <Path
          d="M 28 38 L 28 100 L 78 100 Z"
          stroke={STROKE}
          strokeWidth={1.5}
          fill="none"
          strokeLinejoin="round"
        />
      </AnimatedG>

      {/* Feet — alternating plant/swing cycle */}
      <AnimatedG animatedProps={foot1Props}>
        <Ellipse cx={38} cy={110} rx={5} ry={1.8} fill={HEAD_COLOR} transform="rotate(-20 38 110)" />
      </AnimatedG>
      <AnimatedG animatedProps={foot2Props}>
        <Ellipse cx={54} cy={110} rx={5} ry={1.8} fill={HEAD_COLOR} transform="rotate(-20 54 110)" />
      </AnimatedG>
    </Svg>
  );
}
