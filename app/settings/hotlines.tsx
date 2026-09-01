import { router } from "expo-router";
import { Fragment } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

type Seg = string | { text: string; url: string };

const SECTIONS: { title: string; cards: Seg[][] }[] = [
  {
    title: "Immediate help via phone",
    cards: [
      ["Call ", { text: "988", url: "tel:988" }],
      ["National Suicide Prevention Line at ", { text: "1 800 273 8255", url: "tel:18002738255" }],
    ],
  },
  {
    title: "Immediate help via text",
    cards: [
      ["Text the word HOME to ", { text: "741741", url: "sms:741741" }, " to connect with Crisis Text Line"],
    ],
  },
  {
    title: "For crisis counselors specializing in LGBTQ+ community",
    cards: [
      ["Call the Trevor Project crisis hotline at ", { text: "1-800-488-7386", url: "tel:18004887386" }],
    ],
  },
  {
    title: "For domestic violence support",
    cards: [
      ["Call the National Domestic Violence Hotline at ", { text: "1-800-799-7233", url: "tel:18007997233" }],
    ],
  },
  {
    title: "For veterans",
    cards: [
      [
        "Call the 24/7 Veteran Combat Call Center at ",
        { text: "1 (877) 927-8387", url: "tel:18779278387" },
        " to talk to another combat veteran",
      ],
    ],
  },
];

export default function HotlinesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.title}>Mental health hotlines</Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.cards.map((segs, ci) => (
              <View key={ci} style={styles.card}>
                <Text style={styles.cardText}>
                  {segs.map((seg, si) =>
                    typeof seg === "string" ? (
                      <Fragment key={si}>{seg}</Fragment>
                    ) : (
                      <Text key={si} style={styles.link} onPress={() => Linking.openURL(seg.url)}>
                        {seg.text}
                      </Text>
                    ),
                  )}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  title: { color: "#FFFFFF", fontSize: 32, lineHeight: 38, fontFamily: SERIF, fontWeight: "700", marginTop: 16, marginBottom: 12 },
  section: { marginTop: 18 },
  sectionTitle: { color: "#9A938B", fontSize: 15, lineHeight: 21, fontFamily: "Jost_400Regular", marginBottom: 10 },
  card: { backgroundColor: "#1A1A1A", borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 10 },
  cardText: { color: "#FFFFFF", fontSize: 16, lineHeight: 23, fontFamily: "Jost_400Regular" },
  link: { color: "#7FA8FF", fontFamily: "Jost_600SemiBold" },
});
