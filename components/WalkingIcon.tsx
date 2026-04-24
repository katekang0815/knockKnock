import { useEffect } from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

const STROKE = '#FFFFFF';
const HEAD_COLOR = '#F5E8C8';

interface Props {
  size: number;
}

export default function WalkingIcon({ size }: Props) {
  // Two feet that alternate stepping left (negative x = leftward)
  const foot1X = useSharedValue(0);
  const foot2X = useSharedValue(-8);

  useEffect(() => {
    const stepDuration = 500;
    foot1X.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: stepDuration, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: stepDuration, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    foot2X.value = withRepeat(
      withSequence(
        withTiming(0, { duration: stepDuration, easing: Easing.inOut(Easing.quad) }),
        withTiming(-8, { duration: stepDuration, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const foot1Props = useAnimatedProps(() => ({
    transform: `translate(${foot1X.value}, 0)`,
  }));
  const foot2Props = useAnimatedProps(() => ({
    transform: `translate(${foot2X.value}, 0)`,
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      {/* Head */}
      <Circle cx={32} cy={22} r={7} fill={HEAD_COLOR} />

      {/* Right triangle body — vertical edge on left, hypotenuse from top-left to bottom-right */}
      <Path
        d="M 28 38 L 28 100 L 78 100 Z"
        stroke={STROKE}
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
      />

      {/* Feet — two small tilted ellipses */}
      <AnimatedG animatedProps={foot1Props}>
        <Ellipse cx={38} cy={110} rx={5} ry={1.8} fill={HEAD_COLOR} transform="rotate(-20 38 110)" />
      </AnimatedG>
      <AnimatedG animatedProps={foot2Props}>
        <Ellipse cx={54} cy={110} rx={5} ry={1.8} fill={HEAD_COLOR} transform="rotate(-20 54 110)" />
      </AnimatedG>
    </Svg>
  );
}
