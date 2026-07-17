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
  // When true (default) the ball fades + shrinks on a cycle. When false the ball
  // holds at its smallest size with full opacity (still rolls; base still fades).
  fadeBall?: boolean;
}

// The same gradient orb, slowly rolling left → right and back, repeating. The
// rotation is tied to the horizontal travel so it reads as a true roll.
export default function RollingOrb({ size, fadeBall = true }: Props) {
  // 0 = far left, 1 = far right.
  const roll = useSharedValue(0);
  // Base fade cycle.
  const fade = useSharedValue(0);

  useEffect(() => {
    // The bouncing (non-fading) variant bounces at Sunny's rate: it hops once each
    // time the roll reaches an edge, so 460ms/direction ≈ Sunny's 460ms bounce.
    const rollDuration = fadeBall ? 2600 : 460;
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
  }, []);

  const ball = size * 0.4;    // reference ball diameter (base/halo/positions)
  const travel = size * 0.3;  // total left↔right distance
  const bottom = size * 0.2;  // ball's resting distance from the bottom
  const baseH = ball * 0.14;  // base thickness (matches the other orbs)
  // Rendered ball diameter: full when it fades, else the fading ball's smallest size.
  const ballDiameter = fadeBall ? ball : ball * 0.5;
  // Distinct gradient id per variant so the two instances don't collide.
  const gradId = fadeBall ? "orbGradRoll" : "orbGradRollSmall";
  // Hop height for the non-fading variant's edge bounce.
  const bounceHeight = ball * 0.4;

  // Rolling ball: translate across, rotate by the arc length it covers, and (when
  // enabled) fade + shrink in and out on the same cycle as the base.
  const ballStyle = useAnimatedStyle(() => {
    const x = (roll.value - 0.5) * travel; // -travel/2 → +travel/2
    const rot = (x / (Math.PI * ballDiameter)) * 360; // distance / circumference → degrees
    if (!fadeBall) {
      // Bounce: hop up as the ball nears each end of its travel (roll → 0 or 1).
      const edgeness = 2 * Math.abs(roll.value - 0.5); // 0 in the middle → 1 at the edges
      const airborne = Math.pow(edgeness, 4); // 0 on the base → 1 at the apex
      const hop = airborne * bounceHeight; // stays low, rises sharply at the edges
      // Sunny-style squash-and-stretch: flat on the base, round in the air.
      const scaleY = 0.86 + 0.14 * airborne;
      const scaleX = 2 - scaleY; // preserve rough volume
      return {
        opacity: 1,
        // rotate is rightmost (applied first) so the gradient spins; the squash
        // is applied after it, in world axes, so the ball flattens straight down.
        transform: [
          { translateX: x },
          { translateY: -hop },
          { scaleX },
          { scaleY },
          { rotate: `${rot}deg` },
        ],
      };
    }
    return {
      opacity: 0.2 + fade.value * 0.8, // faded out when big (0.2) → fully in when small (1.0)
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

  // Halo trails along with the ball (no rotation), and hops with it on the
  // non-fading variant's edge bounce.
  const haloStyle = useAnimatedStyle(() => {
    const x = (roll.value - 0.5) * travel;
    if (!fadeBall) {
      const edgeness = 2 * Math.abs(roll.value - 0.5);
      const hop = Math.pow(edgeness, 4) * bounceHeight;
      return { transform: [{ translateX: x }, { translateY: -hop }] };
    }
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
