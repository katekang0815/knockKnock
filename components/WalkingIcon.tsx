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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STROKE = '#FFFFFF';
const HEAD_COLOR = '#F5E8C8';
const BODY_PATH = 'M 28 38 L 46 38 L 103 131 L 28 131 Z';
const LIQUID_GLOW = '#FFB69E';

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

export default function WalkingIcon({ size }: Props) {
  const t = useSharedValue(0);
  const liquidT = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
    // Slow liquid animation — full cycle in 6 seconds
    liquidT.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const scale = size / 110;

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

  // Lava lamp blobs — each oscillates vertically and pulses in size
  const blob1Props = useAnimatedProps(() => {
    const cy = 100 + 22 * Math.sin(liquidT.value * 1.0);
    const r = 11 + 2 * Math.cos(liquidT.value * 1.3);
    return { cy, r };
  });

  const blob2Props = useAnimatedProps(() => {
    const cy = 90 + 28 * Math.sin(liquidT.value * 0.7 + 1.5);
    const r = 8 + 2 * Math.cos(liquidT.value * 0.9 + 0.5);
    return { cy, r };
  });

  const blob3Props = useAnimatedProps(() => {
    const cy = 80 + 18 * Math.sin(liquidT.value * 1.4 + 3);
    const r = 6 + 1.5 * Math.cos(liquidT.value * 1.1 + 2);
    return { cy, r };
  });

  const blob4Props = useAnimatedProps(() => {
    const cy = 110 + 15 * Math.sin(liquidT.value * 0.8 + 4);
    const r = 5 + 1 * Math.cos(liquidT.value * 1.5 + 1);
    return { cy, r };
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Upper body (head + trapezoid + lava lamp) — bobs up and down */}
      <Animated.View style={[StyleSheet.absoluteFill, upperBodyStyle]}>
        <Svg width={size} height={size} viewBox="0 0 110 150">
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

          {/* Liquid contents — clipped to body shape */}
          <G clipPath="url(#bodyClip)">
            {/* Background warm glow */}
            <Path d={BODY_PATH} fill="url(#bgGlow)" />

            {/* Floating particles (subtle dots) */}
            <Circle cx={42} cy={70} r={1.2} fill="#FFF5DD" opacity={0.6} />
            <Circle cx={60} cy={85} r={0.8} fill="#FFF5DD" opacity={0.5} />
            <Circle cx={50} cy={55} r={0.7} fill="#FFF5DD" opacity={0.4} />
            <Circle cx={70} cy={120} r={1} fill="#FFF5DD" opacity={0.5} />
            <Circle cx={45} cy={115} r={0.9} fill="#FFF5DD" opacity={0.4} />
            <Circle cx={80} cy={100} r={0.6} fill="#FFF5DD" opacity={0.5} />

            {/* Lava blobs — animated */}
            <AnimatedCircle animatedProps={blob1Props} cx={50} fill="url(#blobGrad)" />
            <AnimatedCircle animatedProps={blob2Props} cx={68} fill="url(#blobGrad)" />
            <AnimatedCircle animatedProps={blob3Props} cx={45} fill="url(#blobGrad)" />
            <AnimatedCircle animatedProps={blob4Props} cx={75} fill="url(#blobGrad)" />
          </G>

          {/* Body outline (drawn on top) */}
          <Path
            d={BODY_PATH}
            stroke={STROKE}
            strokeWidth={1.5}
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {/* Foot 1 */}
      <Animated.View style={[StyleSheet.absoluteFill, foot1Style]}>
        <Svg width={size} height={size} viewBox="0 0 110 150">
          <Ellipse
            cx={38}
            cy={143}
            rx={5}
            ry={1.8}
            fill={HEAD_COLOR}
            transform="rotate(-20 38 143)"
          />
        </Svg>
      </Animated.View>

      {/* Foot 2 */}
      <Animated.View style={[StyleSheet.absoluteFill, foot2Style]}>
        <Svg width={size} height={size} viewBox="0 0 110 150">
          <Ellipse
            cx={54}
            cy={143}
            rx={5}
            ry={1.8}
            fill={HEAD_COLOR}
            transform="rotate(-20 54 143)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
