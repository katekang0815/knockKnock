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

// The same gradient orb as BouncingOrb, but jittering in place — the subtle
// vibration used by the sub-emotion circles, applied to the ball icon.
export default function VibratingOrb({ size }: Props) {
  const idle = useSharedValue(0);

  useEffect(() => {
    idle.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.linear }),
      -1,
      true,
    );
  }, []);

  const ball = size * 0.4;

  // Same jitter formula as EmotionCircle's idle motion.
  const ballStyle = useAnimatedStyle(() => {
    const phi = idle.value * Math.PI * 2;
    const jitterX = (Math.sin(phi * 3) + Math.sin(phi * 5.3)) * 0.5;
    const jitterY = Math.cos(phi * 4.1) * 0.4;
    return { transform: [{ translateX: jitterX }, { translateY: jitterY }] };
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Halo glow behind the ball */}
      <View
        style={{
          position: "absolute",
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
      <Animated.View style={[{ width: ball, height: ball }, ballStyle]}>
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
