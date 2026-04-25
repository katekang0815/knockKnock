import { useEffect } from 'react';
import Svg, { Path, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
  size: number;
}

const LIGHTNING_COLOR = '#F5E8C8';
const MOUNTAIN_BACK = '#8B4F4A';
const MOUNTAIN_FRONT = '#5C2826';
const CLOUD_COLOR = '#3A1816';
const RAIN_COLOR = '#F5E8C8';
const BIRD_COLOR = '#3A1816';

export default function StormyCardIcon({ size }: Props) {
  const bolt1 = useSharedValue(0);
  const bolt2 = useSharedValue(0);
  const bolt3 = useSharedValue(0);

  useEffect(() => {
    // Main bolt — dramatic double flicker every ~2.5s
    bolt1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0.25, { duration: 50 }),
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 120 }),
        withDelay(2200, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );

    // Secondary bolt — single flash, offset by ~0.8s
    bolt2.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: 60 }),
          withTiming(0, { duration: 100 }),
          withDelay(1900, withTiming(0, { duration: 1 })),
        ),
        -1,
        false,
      ),
    );

    // Accent bolt — quick flicker, offset by ~1.5s
    bolt3.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 40 }),
          withTiming(0.2, { duration: 40 }),
          withTiming(0.7, { duration: 40 }),
          withTiming(0, { duration: 80 }),
          withDelay(2700, withTiming(0, { duration: 1 })),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const bolt1Props = useAnimatedProps(() => ({ opacity: bolt1.value }));
  const bolt2Props = useAnimatedProps(() => ({ opacity: bolt2.value }));
  const bolt3Props = useAnimatedProps(() => ({ opacity: bolt3.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Cloud wisps at top */}
      <G opacity={0.65}>
        <Path
          d="M 0 0 Q 20 -2 40 4 Q 60 8 80 5 Q 95 3 100 8 L 100 18 Q 80 22 60 18 Q 40 14 20 20 Q 8 22 0 16 Z"
          fill={CLOUD_COLOR}
        />
        <Path
          d="M 10 8 Q 30 14 55 12 Q 75 10 95 16 L 95 22 Q 70 18 45 22 Q 25 24 10 18 Z"
          fill={CLOUD_COLOR}
          opacity={0.7}
        />
      </G>

      {/* Mountain silhouettes — back layer */}
      <Path
        d="M 0 72 L 12 52 L 22 62 L 35 45 L 48 58 L 60 42 L 72 56 L 84 48 L 100 60 L 100 100 L 0 100 Z"
        fill={MOUNTAIN_BACK}
        opacity={0.5}
      />

      {/* Mountain silhouettes — front layer */}
      <Path
        d="M 0 85 L 14 70 L 28 82 L 42 66 L 56 78 L 70 62 L 84 76 L 100 68 L 100 100 L 0 100 Z"
        fill={MOUNTAIN_FRONT}
        opacity={0.85}
      />

      {/* Rain streaks */}
      <G stroke={RAIN_COLOR} strokeWidth={0.5} strokeLinecap="round" opacity={0.6}>
        <Path d="M 8 35 l 2 6" fill="none" />
        <Path d="M 18 28 l 2 6" fill="none" />
        <Path d="M 12 50 l 2 6" fill="none" />
        <Path d="M 28 38 l 2 6" fill="none" />
        <Path d="M 38 30 l 2 6" fill="none" />
        <Path d="M 24 60 l 2 6" fill="none" />
        <Path d="M 64 32 l 2 6" fill="none" />
        <Path d="M 72 42 l 2 6" fill="none" />
        <Path d="M 82 28 l 2 6" fill="none" />
        <Path d="M 88 50 l 2 6" fill="none" />
        <Path d="M 50 26 l 2 6" fill="none" />
        <Path d="M 6 65 l 2 6" fill="none" />
        <Path d="M 90 70 l 2 6" fill="none" />
      </G>

      {/* Birds */}
      <G stroke={BIRD_COLOR} strokeWidth={0.8} strokeLinecap="round" fill="none">
        <Path d="M 14 42 l 2.5 -1.5 l 2.5 1.5" />
        <Path d="M 35 55 l 2 -1.2 l 2 1.2" />
        <Path d="M 70 38 l 2.2 -1.3 l 2.2 1.3" />
        <Path d="M 82 60 l 2 -1.2 l 2 1.2" />
        <Path d="M 50 70 l 2.2 -1.3 l 2.2 1.3" />
      </G>

      {/* Lightning bolt — main, animated flash */}
      <AnimatedG
        animatedProps={bolt1Props}
        stroke={LIGHTNING_COLOR}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <Path d="M 56 4 L 48 18 L 58 22 L 42 38 L 54 42 L 36 58 L 50 62 L 32 82" />
        <Path d="M 48 18 L 38 22 L 30 28" />
        <Path d="M 42 38 L 30 42 L 24 50" />
        <Path d="M 54 42 L 66 46 L 74 40" />
      </AnimatedG>

      {/* Lightning bolt — secondary, animated flash */}
      <AnimatedG
        animatedProps={bolt2Props}
        stroke={LIGHTNING_COLOR}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <Path d="M 78 8 L 74 20 L 82 26 L 70 42 L 80 46 L 68 60" />
      </AnimatedG>

      {/* Accent zigzag — animated flash */}
      <AnimatedG
        animatedProps={bolt3Props}
        stroke={LIGHTNING_COLOR}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <Path d="M 14 14 L 18 22 L 12 28 L 20 36" />
      </AnimatedG>
    </Svg>
  );
}
