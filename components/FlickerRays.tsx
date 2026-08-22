import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

/**
 * A ring of radial streaks across the top-right quarter that light ONE AT A TIME
 * in sequence (a flicker), cycling around the arc. Positioned around (cx, cy).
 */

const RAY_COUNT = 7;
const RAY_START_ANGLE = 0; // top (12 o'clock)
const RAY_ARC = 90; // quarter circle, ending at 3 o'clock (top-right)
// Per-ray length multipliers so the streaks vary in length (not uniform).
const RAY_LEN_MULT = [0.8, 1.35, 0.7, 1.5, 0.85, 1.25, 1.05];

function Ray({
  clock,
  index,
  angle,
  cx,
  cy,
  radius,
  length,
  thickness,
}: {
  clock: SharedValue<number>;
  index: number;
  angle: number;
  cx: number;
  cy: number;
  radius: number;
  length: number;
  thickness: number;
}) {
  const rad = ((angle - 90) * Math.PI) / 180;
  const x = cx + radius * Math.cos(rad);
  const y = cy + radius * Math.sin(rad);
  const style = useAnimatedStyle(() => {
    const activeIndex = Math.floor(clock.value * RAY_COUNT) % RAY_COUNT;
    return { opacity: activeIndex === index ? 1 : 0 };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: x - thickness / 2,
          top: y - length / 2,
          width: thickness,
          height: length,
          borderRadius: thickness / 2,
          backgroundColor: "#EBD9C4",
          transform: [{ rotate: `${angle}deg` }],
        },
        style,
      ]}
    />
  );
}

export default function FlickerRays({
  active,
  cx,
  cy,
  radius,
  length,
  thickness = 3,
  duration = 1750,
}: {
  active: boolean; // start/stop (reactive, for reused instances)
  cx: number;
  cy: number;
  radius: number;
  length: number;
  thickness?: number;
  duration?: number; // full cycle through all streaks
}) {
  const clock = useSharedValue(0);
  useEffect(() => {
    if (active) {
      clock.value = withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(clock);
      clock.value = 0;
    }
  }, [active]);

  return (
    <>
      {Array.from({ length: RAY_COUNT }).map((_, i) => {
        const t = i / (RAY_COUNT - 1); // 0..1 across the arc
        return (
          <Ray
            key={i}
            clock={clock}
            index={i}
            angle={RAY_START_ANGLE + RAY_ARC * t}
            cx={cx}
            cy={cy}
            radius={radius}
            length={length * RAY_LEN_MULT[i]}
            thickness={thickness}
          />
        );
      })}
    </>
  );
}
