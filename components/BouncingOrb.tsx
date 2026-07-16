import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Stop, Circle } from "react-native-svg";

interface Props {
  size: number;
}

// A single gradient ball that bounces up and down on the same spot — the
// home-screen BouncingBall's look and warm palette, minus the stair climb.
export default function BouncingOrb({ size }: Props) {
  // 0 = resting on the ground, 1 = apex of the jump.
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 210, easing: Easing.out(Easing.quad) }), // rise
        withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) }),  // fall
        withTiming(0, { duration: 70 }),                                    // brief rest
      ),
      -1,
      false,
    );
  }, []);

  const ball = size * 0.4;      // ball diameter
  const jump = size * 0.34;     // travel from ground to apex
  const rest = size * 0.16;     // ball's resting distance from the bottom

  // Ball: travels up, with a small squash-and-stretch at the ground.
  const ballStyle = useAnimatedStyle(() => {
    const b = bounce.value;
    // Squash only in the last sliver before/at landing.
    const grounded = Math.min(b / 0.12, 1); // 0 at ground → 1 once airborne
    const scaleY = 0.86 + 0.14 * grounded;
    const scaleX = 2 - scaleY; // preserve rough volume
    return {
      transform: [
        { translateY: -b * jump },
        { scaleX },
        { scaleY },
      ],
    };
  });

  // Halo glow that rides with the ball (matches home-screen glow).
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + bounce.value * 0.22,
    transform: [{ translateY: -bounce.value * jump }],
  }));

  // Contact glow on the ground — brightest at the moment of landing.
  const contactStyle = useAnimatedStyle(() => {
    const b = bounce.value;
    const grounded = 1 - Math.min(b / 0.5, 1); // 1 at ground → 0 mid-air
    return {
      opacity: 0.15 + grounded * 0.45,
      transform: [{ scaleX: 0.7 + grounded * 0.5 }],
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Ground contact glow */}
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
          contactStyle,
        ]}
      />

      {/* Halo glow behind the ball */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: rest,
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

      {/* The bouncing ball */}
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
            <LinearGradient id="orbGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#DB533C" />
              <Stop offset="0.5" stopColor="#C78E7D" />
              <Stop offset="1" stopColor="#FFF7CE" />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={48} fill="url(#orbGrad)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
