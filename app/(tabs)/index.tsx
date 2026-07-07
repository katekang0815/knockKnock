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

        <Text style={[styles.title, { top: insets.top + 20 + 96 }]}>
          Ready to climb? Take the first step!
        </Text>

        <View style={[styles.verseCard, { top: insets.top + 20 + 96 + 96 }]}>
          <Text style={styles.verse}>
            {`"He saw a stairway resting on the earth,\nwith its top reaching to heaven."`}
          </Text>
          <Text style={styles.attribution}>— Genesis 28:12</Text>
        </View>

        <Text style={[styles.tapText, { top: insets.top + 20 + 96 + 96 + 160 }]}>
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
  verseCard: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(180,180,180,0.55)",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginHorizontal: 24,
    alignItems: "center",
    maxWidth: "88%",
  },
  verse: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontFamily: "Jost_400Regular",
    fontStyle: "italic",
    lineHeight: 22,
    textAlign: "center",
  },
  attribution: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontFamily: "Jost_400Regular",
    letterSpacing: 1.5,
    marginTop: 10,
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
