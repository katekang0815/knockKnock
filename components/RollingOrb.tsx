import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface Props {
  size: number;
  // true (default) = rain: rolls at a constant small size (base still fades).
  // false = Breezy: rolls + bounces with a Sunny-style squash and contact base.
  fadeBall?: boolean;
  // false = stay in place (bounce only, no horizontal roll).
  rolling?: boolean;
  // Rain-only: diagonal streaks that fall and fade out over the orb.
  rain?: boolean;
}

// Each streak: horizontal position (0..1 across the rain box) + phase offset
// (0..1) so drops fall at staggered times rather than all together.
const RAIN_STREAKS: { x: number; offset: number }[] = [
  { x: 0.08, offset: 0.0 },
  { x: 0.5, offset: 0.14 },
  { x: 0.26, offset: 0.31 },
  { x: 0.7, offset: 0.48 },
  { x: 0.42, offset: 0.62 },
  { x: 0.88, offset: 0.79 },
  { x: 0.6, offset: 0.9 },
];

// One falling streak. Reads a shared 0→1 clock; its own offset shifts its phase.
function RainStreak({
  clock,
  offset,
  left,
  fall,
  dash,
  color,
}: {
  clock: SharedValue<number>;
  offset: number;
  left: number;
  fall: number;
  dash: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const p = (clock.value + offset) % 1; // 0 at top → 1 at bottom
    // Quick fade-in, then fade out as it falls; gone by the end.
    const opacity = Math.min(p * 6, 1) * (1 - p);
    return { opacity, transform: [{ translateY: p * fall }] };
  });
  return (
    <Animated.View style={[{ position: "absolute", left, top: 0, width: dash, height: dash }, style]}>
      <Svg width={dash} height={dash} viewBox="0 0 12 12">
        {/* teardrop: pointed top, round bottom */}
        <Path
          d="M6 1.5 C7.8 5 9.5 7 9.5 8.5 C9.5 10.4 7.9 11.5 6 11.5 C4.1 11.5 2.5 10.4 2.5 8.5 C2.5 7 4.2 5 6 1.5 Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

// The same gradient orb, slowly rolling left → right and back, repeating. The
// rotation is tied to the horizontal travel so it reads as a true roll.
export default function RollingOrb({ size, fadeBall = true, rolling = true, rain = false }: Props) {
  // 0 = far left, 1 = far right.
  const roll = useSharedValue(0);
  // Vertical bounce (Breezy variant) — decoupled from the roll so its speed is
  // independent. 0 = on the base, 1 = apex.
  const bounce = useSharedValue(0);
  // Rain streaks clock: linear 0→1 loop (~1s), each streak phase-shifted.
  const rainClock = useSharedValue(0);

  useEffect(() => {
    // Rain (fading) rolls slower than the bouncing (Breezy) variant.
    const rollDuration = fadeBall ? 2600 : 1300;
    roll.value = withRepeat(
      withTiming(1, { duration: rollDuration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true, // reverse: left→right→left forever
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
    if (rain) {
      rainClock.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }), // half speed
        -1,
        false,
      );
    }
  }, []);

  const ball = size * 0.4;    // reference ball diameter (base/halo scaling)
  // Total left↔right distance — both variants use the same range (0 = bounce in place).
  const travel = rolling ? size * 0.18 : 0;
  const baseH = ball * 0.14;  // base thickness / ball-to-text gap (matches the other orbs)
  const lineH = size * 0.13;  // height of one word row (text base)
  // Rendered ball diameter — 45px, matching the Sunny icon's ball.
  const ballDiameter = 45;
  // Vertically center the ball(45) + gap(baseH) + text(lineH) cluster in the container.
  const bottom = (size - (baseH + ballDiameter + lineH)) / 2 + lineH; // text base top
  // Distinct gradient id per variant so the two instances don't collide.
  const gradId = fadeBall ? "orbGradRoll" : "orbGradRollSmall";
  // Hop height for the non-fading variant's edge bounce.
  const bounceHeight = ball * 0.4;
  // Ball/halo resting bottom — baseH above the text base top (same gap as Stormy).
  // Rain is nudged up 5px; Breezy stays put.
  const ballBottom = bottom + baseH + 5;

  // Rain-streak layout: a small box above the orb that drops slant dashes.
  const rainBox = size * 0.36;
  const rainDash = size * 0.045; // half size
  const rainFall = size * 0.24;
  const rainBottom = ballBottom + ballDiameter * 0.35 + 60; // nudged up 60px
  const rainLeft = size / 2 - rainBox * 0.5 + 30; // nudged right 30px (moved left 30)

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
    // Rain: constant largest size (no size-shifting).
    return {
      opacity: 1,
      transform: [{ translateX: x }, { rotate: `${rot}deg` }],
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

  return (
    <View style={{ width: size, height: size }}>
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

      {/* Rain — slant dashes falling and fading over the orb, each staggered */}
      {rain && (
        <View
          style={{
            position: "absolute",
            bottom: rainBottom,
            left: rainLeft,
            width: rainBox,
            height: rainFall + rainDash,
          }}
          pointerEvents="none"
        >
          {RAIN_STREAKS.map((s, i) => (
            <RainStreak
              key={i}
              clock={rainClock}
              offset={s.offset}
              left={s.x * (rainBox - rainDash)}
              fall={rainFall}
              dash={rainDash}
              color="#E8C6AB"
            />
          ))}
        </View>
      )}
    </View>
  );
}
