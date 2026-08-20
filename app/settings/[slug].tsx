import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

export default function SettingsDetailScreen() {
  const insets = useSafeAreaInsets();
  const { title } = useLocalSearchParams<{ title?: string }>();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>

      <Text style={styles.title}>{title ?? "Settings"}</Text>
      {/* Empty for now — content to come. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000", paddingHorizontal: 22 },
  back: { width: 40, height: 40, justifyContent: "center", marginLeft: -6, marginTop: 6 },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Jost_700Bold",
    marginTop: 16,
  },
});
