import { useEffect } from "react";
import { Text, View } from "react-native";
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

// Sub-emotion label shown on the base.
const WORD = "Anxious";

// The same gradient orb as BouncingOrb, sitting on the same base — but the ball
// jitters in place (the sub-emotion circles' vibration) and the base pulses on a
// steady interval instead of flashing on impact.
export default function VibratingOrb({ size }: Props) {
  // Fast jitter for the ball.
  const idle = useSharedValue(0);
  // Slow steady pulse for the base.
  const pulse = useSharedValue(0);
  // Grow/brighten cycle for the halo.
  const halo = useSharedValue(0);

  useEffect(() => {
    idle.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.linear }),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    halo.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, []);

  const ball = size * 0.4;      // ball diameter (largest, at scale 1)
  const minScale = 45 / ball;   // smallest = 45px
  const rest = size * 0.16;     // base's distance from the bottom (matches BouncingOrb)
  const baseH = ball * 0.14;    // base thickness
  const ballBottom = rest + baseH; // ball sits on top of the base, just touching it
  const lineH = size * 0.13;    // height of one word row

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
        { scale: 1 - halo.value * (1 - minScale) }, // largest (size×0.4) → 45px as halo grows
      ],
    };
  });

  // Base glow pulses in and out on a regular interval.
  const baseStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + pulse.value * 0.45,
    transform: [{ scaleX: 0.8 + pulse.value * 0.4 }],
  }));

  // Halo grows outward and its fill fades so the bigger circle reads weaker;
  // eases back to the initial size + opacity, looping. Its bottom stays anchored
  // to the ball's bottom / base top (grows upward) instead of dipping into the base.
  const haloStyle = useAnimatedStyle(() => {
    const grow = halo.value * 0.45;
    return {
      opacity: 0.5 - halo.value * 0.5, // 0.5 at start → 0.25 mid → 0.0 fully faded out
      transform: [
        { translateY: -ball * 0.75 * grow }, // compensate center-scale so bottom holds
        { scale: 1 + grow },
      ],
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Base — single sub-emotion label with the pulsing animation */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: rest - lineH, // sits directly beneath the ball, where the bar was
            alignSelf: "center",
            width: size,
            height: lineH,
            alignItems: "center",
            justifyContent: "center",
          },
          baseStyle,
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#FFF7CE",
            fontSize: lineH * 0.72,
            fontFamily: "Jost_700Bold",
            letterSpacing: 0.5,
          }}
        >
          {WORD}
        </Text>
      </Animated.View>

      {/* Halo glow behind the ball — grows/brightens on a repeating cycle */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: ballBottom,
            alignSelf: "center",
            width: ball * 1.5,
            height: ball * 1.5,
            borderRadius: ball,
            backgroundColor: "#C78E7D",
            shadowColor: "#C78E7D",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: ball * 0.45,
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
