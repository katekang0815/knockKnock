import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { getFlag, setFlag } from "@/services/securityStore";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

const ITEMS: { key: string; label: string }[] = [
  { key: "knockknock.a11y.reduceMotion.v1", label: "Reduce animation motion" },
  { key: "knockknock.a11y.noHaptics.v1", label: "Turn off haptics" },
  { key: "knockknock.a11y.noToolsAnim.v1", label: "Turn off tools tab animations" },
  { key: "knockknock.a11y.noItalics.v1", label: "Turn off italics text blocks" },
  { key: "knockknock.a11y.preventAudio.v1", label: "Prevent audio interference" },
];

function WarnIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5 L21 19 L3 19 Z" stroke="#C9C3BB" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M12 9.5 L12 14" stroke="#C9C3BB" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 16.4 L12 16.5" stroke="#C9C3BB" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default function AccessibilityScreen() {
  const insets = useSafeAreaInsets();
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(ITEMS.map(async (i) => [i.key, await getFlag(i.key)] as const));
      setFlags(Object.fromEntries(entries));
    })();
  }, []);

  const toggle = async (key: string, val: boolean) => {
    setFlags((prev) => ({ ...prev, [key]: val }));
    await setFlag(key, val);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.title}>Accessibility</Text>

        {ITEMS.map((item) => (
          <View key={item.key} style={styles.row}>
            <WarnIcon />
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Switch
              value={!!flags[item.key]}
              onValueChange={(v) => toggle(item.key, v)}
              trackColor={{ true: "#34C759", false: "#3A3A3C" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#3A3A3C"
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000", paddingHorizontal: 22 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  title: { color: "#FFFFFF", fontSize: 32, fontFamily: SERIF, fontWeight: "700", marginTop: 16, marginBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
  },
  rowLabel: { flex: 1, color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular", marginLeft: 16 },
});
