import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { getLanguage, setLanguage } from "@/services/languageStore";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

const LANGUAGES: { code: string; label: string; sub?: string }[] = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어", sub: "Korean" },
  { code: "es", label: "Español", sub: "Spanish" },
  { code: "fr", label: "Français", sub: "French" },
  { code: "de", label: "Deutsch", sub: "German" },
  { code: "pt", label: "Português", sub: "Portuguese" },
  { code: "zh", label: "中文", sub: "Chinese" },
  { code: "ja", label: "日本語", sub: "Japanese" },
];

function Check() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13 l4 4 L19 7" stroke="#E0967D" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>("en");

  useEffect(() => {
    getLanguage().then(setSelected);
  }, []);

  const choose = async (code: string) => {
    setSelected(code);
    await setLanguage(code);
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

        <Text style={styles.title}>Language</Text>

        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.row}
            onPress={() => choose(lang.code)}
            activeOpacity={0.6}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{lang.label}</Text>
              {lang.sub && <Text style={styles.rowSub}>{lang.sub}</Text>}
            </View>
            {selected === lang.code && <Check />}
          </TouchableOpacity>
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
  title: { color: "#FFFFFF", fontSize: 32, fontFamily: SERIF, fontWeight: "700", marginTop: 16, marginBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  rowLabel: { color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular" },
  rowSub: { color: "#9A938B", fontSize: 13, fontFamily: "Jost_400Regular", marginTop: 2 },
});
