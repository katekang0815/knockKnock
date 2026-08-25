import { router } from "expo-router";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });
const STROKE = "#CFC9C1";
const SW = 1.6;

const TERMS_URL = "https://katekang0815.github.io/knockKnock/terms.html";
const PRIVACY_URL = "https://katekang0815.github.io/knockKnock/privacy-policy.html";
const CONTACT_EMAIL = "yehsunkang@gmail.com";

function TermsIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3 H15 L19 7 V21 H6 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M9 12 H15 M9 15.5 H15 M9 8.5 H12" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function ShieldIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3 L19 6 V11 C19 15.5 16 19 12 21 C8 19 5 15.5 5 11 V6 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M9 12 L11 14 L15 9.5" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function ChatIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 6 C4.5 5 5.3 4.2 6.3 4.2 L17.7 4.2 C18.7 4.2 19.5 5 19.5 6 L19.5 14 C19.5 15 18.7 15.8 17.7 15.8 L9.5 15.8 L5.5 19.5 L5.5 15.8 C4.9 15.8 4.5 15.2 4.5 14.5 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
    </Svg>
  );
}
function Arrow() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12 L18 12 M13 6 L19 12 L13 18" stroke="#FFFFFF" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  const ROWS: { label: string; icon: () => React.ReactElement; onPress: () => void }[] = [
    { label: "Terms of Service", icon: TermsIcon, onPress: () => Linking.openURL(TERMS_URL) },
    { label: "Privacy Policy", icon: ShieldIcon, onPress: () => Linking.openURL(PRIVACY_URL) },
    {
      label: "Contact the team",
      icon: ChatIcon,
      onPress: () => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("KnockKnock - Contact")}`),
    },
  ];

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

        <Text style={styles.title}>About</Text>

        {ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <TouchableOpacity key={row.label} style={styles.row} onPress={row.onPress} activeOpacity={0.6}>
              <View style={styles.rowIcon}>
                <Icon />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Arrow />
            </TouchableOpacity>
          );
        })}

        {/* App description (moved here from the Learn More page) */}
        <Text style={styles.body}>
          KnockKnock is a gentle prayer companion that meets you in whatever you&apos;re feeling
          right now - joyful, anxious, grateful, or somewhere in between - and helps you turn that
          moment into honest prayer.
        </Text>
        <Text style={styles.body}>
          Instead of pushing feelings aside, it invites you to notice them, talk them through, and
          bring them to God, then offers a personal prayer or a Bible verse for where you are.
        </Text>
        <Text style={styles.body}>
          It&apos;s a simple, unhurried, judgment-free space to reflect, pray, and feel a little
          less alone.
        </Text>
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
  title: { color: "#FFFFFF", fontSize: 32, fontFamily: SERIF, fontWeight: "700", marginTop: 16, marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  rowIcon: { width: 30, alignItems: "center", marginRight: 14 },
  rowLabel: { flex: 1, color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular" },
  body: { color: "#C9C2BA", fontSize: 16, lineHeight: 25, fontFamily: "Jost_400Regular", marginTop: 16 },
});
