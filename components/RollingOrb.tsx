import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Stop, Circle } from "react-native-svg";

interface Props {
  size: number;
}

// The same gradient orb, slowly rolling left → right and back, repeating. The
// rotation is tied to the horizontal travel so it reads as a true roll.
export default function RollingOrb({ size }: Props) {
  // 0 = far left, 1 = far right.
  const roll = useSharedValue(0);
  // Base fade cycle.
  const fade = useSharedValue(0);

  useEffect(() => {
    roll.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true, // reverse: left→right→left forever
    );
    fade.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, []);

  const ball = size * 0.4;    // ball diameter
  const travel = size * 0.3;  // total left↔right distance
  const bottom = size * 0.2;  // ball's resting distance from the bottom
  const baseH = ball * 0.14;  // base thickness (matches the other orbs)

  // Rolling ball: translate across, rotate by the arc length it covers, and fade
  // in and out on the same cycle as the base.
  const ballStyle = useAnimatedStyle(() => {
    const x = (roll.value - 0.5) * travel; // -travel/2 → +travel/2
    const rot = (x / (Math.PI * ball)) * 360; // distance / circumference → degrees
    return {
      opacity: 1 - fade.value * 0.5, // 1 → 0.5 and back
      transform: [
        { translateX: x },
        // Keep the ball's bottom on the base's top edge while it scales about its
        // center: shrinking lifts the bottom by (ball/2)(1-scale), so push it down.
        { translateY: ball * 0.25 * fade.value },
        { rotate: `${rot}deg` },
        { scale: 1 - fade.value * 0.5 }, // shrinks to half size as it fades
      ],
    };
  });

  // Halo trails along with the ball (no rotation).
  const haloStyle = useAnimatedStyle(() => {
    const x = (roll.value - 0.5) * travel;
    return { transform: [{ translateX: x }] };
  });

  // Base follows the ball's bottom horizontally and fades in and out.
  const baseStyle = useAnimatedStyle(() => {
    const x = (roll.value - 0.5) * travel;
    return {
      opacity: 0.55 - fade.value * 0.45, // 0.55 → 0.1 and back
      transform: [{ translateX: x }],
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Ground base — follows the ball's bottom as it rolls */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: bottom - baseH,
            alignSelf: "center",
            width: ball * 0.55,
            height: baseH,
            borderRadius: baseH,
            backgroundColor: "#FFF7CE",
          },
          baseStyle,
        ]}
      />

      {/* Halo glow riding with the ball */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom,
            alignSelf: "center",
            width: ball * 1.4,
            height: ball * 1.4,
            borderRadius: ball,
            backgroundColor: "#C78E7D",
            opacity: 0.3,
            shadowColor: "#C78E7D",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: ball * 0.4,
          },
          haloStyle,
        ]}
      />

      {/* The rolling ball */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom,
            alignSelf: "center",
            width: ball,
            height: ball,
          },
          ballStyle,
        ]}
      >
        <Svg width={ball} height={ball} viewBox="0 0 100 100">
          <Defs>
            {/* Home-screen palette: coral → dusty rose → cream */}
            <LinearGradient id="orbGradRoll" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#DB533C" />
              <Stop offset="0.5" stopColor="#C78E7D" />
              <Stop offset="1" stopColor="#FFF7CE" />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={48} fill="url(#orbGradRoll)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
