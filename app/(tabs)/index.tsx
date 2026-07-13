import BouncingBall from "@/components/BouncingBall";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { height: SCREEN_H } = Dimensions.get("window");
const SHAPE_SIZE = 120;

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // "Knock Knock" — each word taps like a hand hitting a door, with a rest between pairs.
  const knock1 = useSharedValue(0);
  const knock2 = useSharedValue(0);

  useEffect(() => {
    const HIT = 90;      // fist meeting the door
    const RELEASE = 200; // pulling back
    const GAP = 130;     // between the two knocks
    const REST = 900;    // pause before the pair repeats

    const knockHit = () =>
      withSequence(
        withTiming(1, { duration: HIT, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: RELEASE, easing: Easing.out(Easing.quad) }),
      );

    knock1.value = withRepeat(
      withSequence(
        knockHit(),
        withDelay(GAP + HIT + RELEASE + REST, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );

    knock2.value = withDelay(
      HIT + RELEASE + GAP,
      withRepeat(
        withSequence(
          knockHit(),
          withDelay(HIT + RELEASE + GAP + REST, withTiming(0, { duration: 1 })),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const knock1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -knock1.value * 5 },
      { scale: 1 + knock1.value * 0.08 },
    ],
  }));

  const knock2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -knock2.value * 5 },
      { scale: 1 + knock2.value * 0.08 },
    ],
  }));

  return (
    <TouchableWithoutFeedback onPress={() => router.push("/checkin")}>
      <View style={styles.container}>
        {/* Back arrow */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 16 }]}
          onPress={(e) => {
            e.stopPropagation();
            router.replace("/splash");
          }}
          activeOpacity={0.7}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <View style={[styles.titleContainer, { top: insets.top + 20 + 96 }]}>
          <View style={styles.titleLine}>
            <Animated.View style={knock1Style}>
              <Text style={styles.titleKnock}>Knock</Text>
            </Animated.View>
            <Text style={styles.titleKnock}>{' '}</Text>
            <Animated.View style={knock2Style}>
              <Text style={styles.titleKnock}>Knock</Text>
            </Animated.View>
          </View>
          <WhisperGradientText id="whisperGrad" />
        </View>

        <Text style={[styles.tapText, { top: insets.top + 20 + 96 + 130 }]}>
          Tap anywhere to start
        </Text>

        {/* Bouncing ball animation */}
        <View style={[styles.shapeContainer, { bottom: 200 }]}>
          <BouncingBall size={SHAPE_SIZE * 2} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

// Renders "whenever you're ready" with a vertical gradient matching BouncingBall's
// warmGrad: coral (#DB533C) → dusty rose (#C78E7D) → cream (#FFF7CE).
function WhisperGradientText({ id }: { id: string }) {
  return (
    <Svg width={320} height={32} viewBox="0 0 320 32">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DB533C" />
          <Stop offset="0.5" stopColor="#C78E7D" />
          <Stop offset="1" stopColor="#FFF7CE" />
        </LinearGradient>
      </Defs>
      <SvgText
        x={160}
        y={23}
        fontSize={24}
        fontFamily="Jost_700Bold"
        textAnchor="middle"
        fill={`url(#${id})`}
      >
        whenever you&apos;re ready
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  titleContainer: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 35,
    gap: 8,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleKnock: {
    color: "#FFFFFF",
    fontSize: 44,
    fontFamily: "Jost_700Bold",
    lineHeight: 52,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  tapText: {
    position: "absolute",
    alignSelf: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontFamily: "Jost_400Regular",
    letterSpacing: 1,
  },
  shapeContainer: {
    position: "absolute",
    alignSelf: "center",
  },
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
