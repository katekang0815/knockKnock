import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

const STROKE = "#FFFFFF";
const HEAD_COLOR = "#F5E8C8";

interface Props {
  size: number;
}

/**
 * Walking-left cycle (body-frame). One full gait = 1100ms.
 * - Plant (0 → 0.5): foot grounded, drifts back as body moves left
 * - Swing (0.5 → 1): foot lifts, arcs forward to plant ahead
 * - Two feet offset by 0.5
 * - Upper body bobs up at t=0.25 & t=0.75 (feet pass)
 */
function footPosition(phase: number) {
  "worklet";
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

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // viewBox is 110 wide → 1 unit = size/110 screen pixels
  const scale = size / 110;

  const upperBodyStyle = useAnimatedStyle(() => {
    const bobY = -2.5 * Math.abs(Math.sin(t.value * 2 * Math.PI));
    return { transform: [{ translateY: bobY * scale }] };
  });

  const foot1Style = useAnimatedStyle(() => {
    const { x, y } = footPosition(t.value % 1);
    return {
      transform: [{ translateX: x * scale }, { translateY: y * scale }],
    };
  });

  const foot2Style = useAnimatedStyle(() => {
    const { x, y } = footPosition((t.value + 0.5) % 1);
    return {
      transform: [{ translateX: x * scale }, { translateY: y * scale }],
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Upper body (head + trapezoid) — bobs up and down */}
      <Animated.View style={[StyleSheet.absoluteFill, upperBodyStyle]}>
        <Svg width={size} height={size} viewBox="0 0 110 150">
          <Circle cx={18} cy={25} r={6} fill={HEAD_COLOR} />
          <Path
            d="M 28 38 L 46 38 L 103 131 L 28 131 Z"
            stroke={STROKE}
            strokeWidth={1.5}
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {/* Foot 1 — alternating walk cycle */}
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

      {/* Foot 2 — offset by half cycle */}
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
