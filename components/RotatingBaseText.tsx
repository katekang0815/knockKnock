import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

// One word row. Opaque when it's the settled word entering at the bottom (rel = 0),
// fading to transparent as it rises out the top (rel → -1). Words still below the
// current one (rel > 0) stay opaque but are clipped by the window's overflow.
function FadingWord({
  word,
  index,
  scroll,
  lineH,
}: {
  word: string;
  index: number;
  scroll: SharedValue<number>;
  lineH: number;
}) {
  const style = useAnimatedStyle(() => {
    const rel = index - scroll.value; // 0 = settled at the bottom, negative = rising up
    return { opacity: Math.min(Math.max(1 + rel, 0), 1) };
  });
  return (
    <Animated.View
      style={[{ height: lineH, alignItems: "center", justifyContent: "center" }, style]}
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
  );
}

// A single-row window that scrolls a word list upward. Each word appears opaque
// at the bottom and fades only as it moves up (no whole-list fade).
export default function RotatingBaseText({
  words,
  scroll,
  lineH,
  width,
}: {
  words: string[];
  scroll: SharedValue<number>;
  lineH: number;
  width: number;
}) {
  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scroll.value * lineH }],
  }));
  return (
    <View style={{ width, height: lineH, overflow: "hidden" }}>
      <Animated.View style={listStyle}>
        {[...words, words[0]].map((w, i) => (
          <FadingWord key={`${w}-${i}`} word={w} index={i} scroll={scroll} lineH={lineH} />
        ))}
      </Animated.View>
    </View>
  );
}
