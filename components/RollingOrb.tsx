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
  // true (default) = rain: rolls at a constant small size (base still fades).
  // false = Breezy: rolls + bounces with a Sunny-style squash and contact base.
  fadeBall?: boolean;
}

// Single sub-emotion label shown on each variant's base.
const RAIN_WORD = "Sad";
const BREEZE_WORD = "Calm";

// The same gradient orb, slowly rolling left → right and back, repeating. The
// rotation is tied to the horizontal travel so it reads as a true roll.
export default function RollingOrb({ size, fadeBall = true }: Props) {
  const word = fadeBall ? RAIN_WORD : BREEZE_WORD;
  // 0 = far left, 1 = far right.
  const roll = useSharedValue(0);
  // Base fade cycle (rain variant).
  const fade = useSharedValue(0);
  // Vertical bounce (Breezy variant) — decoupled from the roll so its speed is
  // independent. 0 = on the base, 1 = apex.
  const bounce = useSharedValue(0);
  // Shared "Stormy" base pulse (same for every icon's base text).
  const pulse = useSharedValue(0);

  useEffect(() => {
    // Rain (fading) rolls slower than the bouncing (Breezy) variant.
    const rollDuration = fadeBall ? 2600 : 1300;
    roll.value = withRepeat(
      withTiming(1, { duration: rollDuration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true, // reverse: left→right→left forever
    );
    fade.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    // 1000ms per hop = 1.0 hops/second.
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 523, easing: Easing.out(Easing.quad) }), // rise
        withTiming(0, { duration: 477, easing: Easing.in(Easing.quad) }),  // fall
      ),
      -1,
      false,
    );

    pulse.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, []);

  const ball = size * 0.4;    // reference ball diameter (base/halo/positions)
  // No rolling — both variants stay in place (Breeze still bounces; rain fades).
  const travel = 0;
  const bottom = size * 0.2;  // ball's resting distance from the bottom
  const baseH = ball * 0.14;  // base thickness (matches the other orbs)
  const lineH = size * 0.13;  // height of one word row (rain's text base)
  // Rendered ball diameter — both variants use the small (formerly "smallest") size.
  const ballDiameter = ball * 0.5;
  // Rain pulses its ball between 12px and ballDiameter (32px at size 160).
  const rainMinScale = 12 / ballDiameter;
  // Distinct gradient id per variant so the two instances don't collide.
  const gradId = fadeBall ? "orbGradRoll" : "orbGradRollSmall";
  // Hop height for the non-fading variant's edge bounce.
  const bounceHeight = ball * 0.4;
  // Ball/halo resting bottom. The bouncing (Breezy) variant sits lower so its
  // bottom aligns with the base's bottom (like Sunny) — the ball presses into the
  // base and the widening contact glow reads as a squash. Rain (fading) is unchanged.
  const ballBottom = fadeBall ? bottom : bottom - baseH * 0.5;

  // Rolling ball: translate across and rotate by the arc length it covers. Breezy
  // adds a vertical bounce + squash; rain just rolls at a constant size.
  const ballStyle = useAnimatedStyle(() => {
    const x = (roll.value - 0.5) * travel; // -travel/2 → +travel/2
    const rot = (x / (Math.PI * ballDiameter)) * 360; // distance / circumference → degrees
    if (!fadeBall) {
      // Vertical hop from the dedicated bounce driver (independent of roll speed).
      const b = bounce.value; // 0 on the base → 1 at the apex
      const hop = b * bounceHeight;
      // Sunny-style squash: only a brief pulse right at the base contact.
      const grounded = Math.min(b / 0.12, 1); // 0 at the base → 1 once airborne
      const scaleY = 0.86 + 0.14 * grounded; // 0.86 squashed on contact → 1 round in the air
      const scaleX = 2 - scaleY; // preserve rough volume
      return {
        opacity: 1,
        // rotate rightmost (applied first) so the gradient spins; the squash after
        // it (world axes) flattens the ball straight down on contact.
        transform: [
          { translateX: x },
          { translateY: -hop },
          { scaleX },
          { scaleY },
          { rotate: `${rot}deg` },
        ],
      };
    }
    // Rain: ball size pulses between 12px and 32px on the fade cycle.
    const s = 1 - fade.value * (1 - rainMinScale); // 1.0 (32px) → 12px
    const lift = (ballDiameter / 2) * (1 - s); // keep the bottom on the base as it shrinks
    return {
      opacity: 1,
      transform: [
        { translateX: x },
        { translateY: lift },
        { rotate: `${rot}deg` },
        { scale: s },
      ],
    };
  });

  // Halo trails along with the ball (no rotation), and hops with it on the
  // non-fading variant's edge bounce.
  const haloStyle = useAnimatedStyle(() => {
    const x = (roll.value - 0.5) * travel;
    if (!fadeBall) {
      const hop = bounce.value * bounceHeight;
      return {
        // Reversed: brightest when hitting the base, lighter as it bounces back up.
        opacity: 0.4 - bounce.value * 0.22, // 0.40 on the base → 0.18 at the apex
        transform: [{ translateX: x }, { translateY: -hop }],
      };
    }
    return { transform: [{ translateX: x }] };
  });

  // Base text pulse — same steady pulse as the Stormy icon's base (centered).
  const baseStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + pulse.value * 0.45,
    transform: [{ scaleX: 0.8 + pulse.value * 0.4 }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      {/* Base — single sub-emotion label with the shared Stormy pulse */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: bottom - lineH, // sits directly beneath the ball, where the bar was
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
          {word}
        </Text>
      </Animated.View>

      {/* Halo glow riding with the ball */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: ballBottom,
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
            bottom: ballBottom,
            alignSelf: "center",
            width: ballDiameter,
            height: ballDiameter,
          },
          ballStyle,
        ]}
      >
        <Svg width={ballDiameter} height={ballDiameter} viewBox="0 0 100 100">
          <Defs>
            {/* Home-screen palette: coral → dusty rose → cream */}
            <LinearGradient id={gradId} x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#DB533C" />
              <Stop offset="0.5" stopColor="#C78E7D" />
              <Stop offset="1" stopColor="#FFF7CE" />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={48} fill={`url(#${gradId})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}
