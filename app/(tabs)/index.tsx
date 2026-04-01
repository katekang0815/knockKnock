import BouncingBall from "@/components/BouncingBall";
import { router } from "expo-router";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const { height: SCREEN_H } = Dimensions.get("window");
const SHAPE_SIZE = 120;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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

        <Text style={[styles.title, { top: insets.top + 30 + 96 }]}>
          Let{`'`}s check in and begin today{`'`}s devotional!
        </Text>

        <Text style={[styles.tapText, { top: insets.top + 30 + 96 + 80 }]}>
          Tap anywhere to start
        </Text>

        {/* Bouncing ball animation */}
        <View style={[styles.shapeContainer, { bottom: SCREEN_H / 3 + 10 }]}>
          <BouncingBall size={SHAPE_SIZE * 2} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  title: {
    position: "absolute",
    alignSelf: "center",
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Jost_700Bold",
    lineHeight: 34,
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
