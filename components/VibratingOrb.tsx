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

// The same gradient orb as BouncingOrb, sitting on the same base — but the ball
// jitters in place (the sub-emotion circles' vibration) and the base pulses on a
// steady interval instead of flashing on impact.
export default function VibratingOrb({ size }: Props) {
  // Fast jitter for the ball.
  const idle = useSharedValue(0);
  // Grow/brighten cycle for the halo.
  const halo = useSharedValue(0);

  useEffect(() => {
    idle.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.linear }),
      -1,
      true,
    );
    halo.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, []);

  const ball = size * 0.4;      // ball box (rendered at 45px via minScale)
  const minScale = 45 / ball;   // smallest = 45px
  const baseH = ball * 0.14;    // base thickness / ball-to-text gap
  const lineH = size * 0.13;    // height of one word row
  // Vertically center the ball(45) + gap(baseH) + text(lineH) cluster in the container.
  const rest = (size - (baseH + 45 + lineH)) / 2 + lineH; // text base top
  const ballBottom = rest + baseH + 5; // ball sits `baseH` above the text base top, nudged up 5px
  // Halo base sized so its largest (× 1.45 growth) reaches size × 0.70.
  const haloBase = (size * 0.7) / 1.45;

  // Same jitter formula as EmotionCircle's idle motion, plus a gentle shrink that
  // rides the halo cycle: ball dips to a bit smaller as the halo grows, and returns
  // to its current size as the halo shrinks back.
  const ballStyle = useAnimatedStyle(() => {
    const phi = idle.value * Math.PI * 2;
    const jitterX = (Math.sin(phi * 3) + Math.sin(phi * 5.3)) * 1.0;
    const jitterY = Math.cos(phi * 4.1) * 0.8;
    return {
      transform: [
        { translateX: jitterX },
        { translateY: jitterY },
        { scale: minScale }, // constant smallest size (45px), no size animation
      ],
    };
  });

  // Halo grows upward only (bottom anchored via transformOrigin) and its fill
  // fades in to mid-size then back out, looping.
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - Math.abs(2 * halo.value - 1)), // 0.0 small → 0.5 mid → 0.0 fully grown
    transform: [{ scale: 1 + halo.value * 0.45 }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      {/* Halo glow behind the ball — grows/brightens on a repeating cycle */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: ballBottom,
            alignSelf: "center",
            width: haloBase,
            height: haloBase,
            borderRadius: haloBase / 2,
            backgroundColor: "#C78E7D",
            transformOrigin: "center bottom", // scale grows upward, bottom pinned
            shadowColor: "#C78E7D",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: haloBase * 0.3,
          },
          haloStyle,
        ]}
      />

      {/* The vibrating ball */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: ballBottom,
            alignSelf: "center",
            width: ball,
            height: ball,
            transformOrigin: "center bottom", // scale shrinks toward the bottom, pinning it to the halo's base
          },
          ballStyle,
        ]}
      >
        <Svg width={ball} height={ball} viewBox="0 0 100 100">
          <Defs>
            {/* Home-screen palette: coral → dusty rose → cream */}
            <LinearGradient id="orbGradVibe" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#DB533C" />
              <Stop offset="0.5" stopColor="#C78E7D" />
              <Stop offset="1" stopColor="#FFF7CE" />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={48} fill="url(#orbGradVibe)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
