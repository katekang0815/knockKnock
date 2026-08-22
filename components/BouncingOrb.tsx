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
import FlickerRays from "@/components/FlickerRays";

interface Props {
  size: number;
  // Sunny-only: flickering radial streaks around the orb (one at a time).
  rays?: boolean;
}

// A single gradient ball that bounces up and down on the same spot — the
// home-screen BouncingBall's look and warm palette, minus the stair climb.
export default function BouncingOrb({ size, rays = false }: Props) {
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

  const ball = 45;              // ball diameter (fixed 45px)
  const jump = size * 0.34;     // travel from ground to apex
  const lineH = size * 0.13;    // height of one word row
  const gap = size * 0.056;     // ball-to-text gap (same as the other icons)
  // Vertically center the ball + gap + text cluster in the container.
  // `rest` is the text base top; the cluster spans [rest - lineH, rest + gap + ball].
  const rest = (size - (gap + ball + lineH)) / 2 + lineH;
  // Ball/halo resting bottom — `gap` above the text base top, nudged up 5px to
  // match the Stormy/Calm icons.
  const ballBottom = rest + gap + 5;

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

  return (
    <View style={{ width: size, height: size }}>
      {/* Halo glow behind the ball */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: ballBottom,
            alignSelf: "center",
            width: size * 0.56, // matches the Breezy icon's halo (ball×1.4)
            height: size * 0.56,
            borderRadius: size * 0.28,
            backgroundColor: "#C78E7D",
            shadowColor: "#C78E7D",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: size * 0.16,
          },
          haloStyle,
        ]}
      />

      {/* The bouncing ball */}
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
            <LinearGradient id="orbGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#DB533C" />
              <Stop offset="0.5" stopColor="#C78E7D" />
              <Stop offset="1" stopColor="#FFF7CE" />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={48} fill="url(#orbGrad)" />
        </Svg>
      </Animated.View>

      {/* Flickering rays around the orb (Sunny) — one streak lit at a time */}
      {rays && (
        <FlickerRays
          active={rays}
          cx={size / 2 + 10}
          cy={size - ballBottom - ball / 2 - 50}
          radius={size * 0.32}
          length={size * 0.05}
        />
      )}
    </View>
  );
}
