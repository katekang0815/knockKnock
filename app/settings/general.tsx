import { router } from "expo-router";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

const STROKE = "#FFFFFF";
const SW = 1.6;

/* ---------- Row icons (simple white outlines) ---------- */
function LockIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10.5} width={14} height={9.5} rx={2} stroke={STROKE} strokeWidth={SW} />
      <Path d="M8 10.5 L8 8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 L16 10.5" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function LifebuoyIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.2} stroke={STROKE} strokeWidth={SW} />
      <Circle cx={12} cy={12} r={3.3} stroke={STROKE} strokeWidth={SW} />
      <Path d="M14.4 9.6 L18 6 M9.6 9.6 L6 6 M14.4 14.4 L18 18 M9.6 14.4 L6 18" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function InfoIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.2} stroke={STROKE} strokeWidth={SW} />
      <Path d="M12 11 L12 16.5" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <Circle cx={12} cy={7.8} r={0.5} fill={STROKE} stroke={STROKE} strokeWidth={1} />
    </Svg>
  );
}
function Arrow() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12 L18 12 M13 7 L18 12 L13 17" stroke="#B8B0A8" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

type Item = { slug: string; label: string; icon: () => React.ReactElement };

const ITEMS: Item[] = [
  { slug: "about", label: "About", icon: InfoIcon },
  { slug: "security", label: "Security & data", icon: LockIcon },
  { slug: "hotlines", label: "Mental health hotlines", icon: LifebuoyIcon },
];

export default function GeneralSettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <TouchableOpacity style={styles.close} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M6 6 L18 18 M18 6 L6 18" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.title}>Settings</Text>

        <View style={styles.list}>
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.slug}
                style={styles.row}
                activeOpacity={0.6}
                onPress={() =>
                  item.slug === "security"
                    ? router.push("/settings/security")
                    : item.slug === "hotlines"
                    ? router.push("/settings/hotlines")
                    : router.push("/settings/about")
                }
              >
                <View style={styles.rowIcon}>
                  <Icon />
                </View>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Arrow />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000", paddingHorizontal: 22 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontFamily: SERIF,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 18,
  },
  list: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  rowIcon: { width: 30, alignItems: "center", marginRight: 14 },
  rowLabel: { flex: 1, color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular" },
});
