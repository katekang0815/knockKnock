import { useEffect } from "react";
import { Text, View } from "react-native";
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

// Sub-emotions cycled by the rotating "base" text.
const WORDS = ["Happy", "Confident", "Thrilled", "Amazed", "Excited"];

// A single gradient ball that bounces up and down on the same spot — the
// home-screen BouncingBall's look and warm palette, minus the stair climb.
export default function BouncingOrb({ size }: Props) {
  // 0 = resting on the ground, 1 = apex of the jump.
  const bounce = useSharedValue(0);
  // Which word is showing — index into WORDS, animated to scroll the list up.
  const scroll = useSharedValue(0);

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

    // Step up one word at a time, holding on each. The list renders a duplicate
    // of the first word at the end, so snapping back to 0 is invisible.
    const steps: number[] = [];
    for (let i = 1; i <= WORDS.length; i++) {
      steps.push(withTiming(i, { duration: 450, easing: Easing.inOut(Easing.quad) }) as number); // shift up
      steps.push(withTiming(i, { duration: 950 }) as number);                                     // hold
    }
    steps.push(withTiming(0, { duration: 0 }) as number); // seamless wrap
    scroll.value = withRepeat(withSequence(...steps), -1, false);
  }, []);

  const ball = 40;              // ball diameter (fixed 40px)
  const jump = size * 0.34;     // travel from ground to apex
  const rest = size * 0.16;     // ball's resting distance from the bottom
  const lineH = size * 0.13;    // height of one word row

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

  // Vertical word rotation for the base.
  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scroll.value * lineH }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      {/* Base — sub-emotion words rotating vertically, keeping the contact
          glow's brighten/widen animation in place of the old glow bar */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: rest - lineH, // sits directly beneath the ball, where the bar was
            alignSelf: "center",
            width: size,
            height: lineH,
            overflow: "hidden",
          },
          contactStyle,
        ]}
      >
        <Animated.View style={scrollStyle}>
          {[...WORDS, WORDS[0]].map((word, i) => (
            <View
              key={`${word}-${i}`}
              style={{ height: lineH, alignItems: "center", justifyContent: "center" }}
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
                {word}
              </Text>
            </View>
          ))}
        </Animated.View>
      </Animated.View>

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
