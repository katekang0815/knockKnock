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
  // Slow steady pulse for the base.
  const pulse = useSharedValue(0);

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
  }, []);

  const ball = size * 0.4;   // ball diameter
  const rest = size * 0.16;  // resting distance from the bottom (matches BouncingOrb)

  // Same jitter formula as EmotionCircle's idle motion.
  const ballStyle = useAnimatedStyle(() => {
    const phi = idle.value * Math.PI * 2;
    const jitterX = (Math.sin(phi * 3) + Math.sin(phi * 5.3)) * 0.5;
    const jitterY = Math.cos(phi * 4.1) * 0.4;
    return { transform: [{ translateX: jitterX }, { translateY: jitterY }] };
  });

  // Base glow pulses in and out on a regular interval.
  const baseStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + pulse.value * 0.45,
    transform: [{ scaleX: 0.8 + pulse.value * 0.4 }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      {/* Ground base glow — pulsing */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: rest,
            alignSelf: "center",
            width: ball * 0.55,
            height: ball * 0.14,
            borderRadius: ball,
            backgroundColor: "#FFF7CE",
          },
          baseStyle,
        ]}
      />

      {/* Halo glow behind the ball */}
      <View
        style={{
          position: "absolute",
          bottom: rest,
          alignSelf: "center",
          width: ball * 1.5,
          height: ball * 1.5,
          borderRadius: ball,
          backgroundColor: "#C78E7D",
          opacity: 0.32,
          shadowColor: "#C78E7D",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: ball * 0.45,
        }}
      />

      {/* The vibrating ball */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: rest,
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
