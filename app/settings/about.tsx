import { router } from "expo-router";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

const PRIVACY_URL = "https://katekang0815.github.io/knockKnock/privacy-policy.html";
const SUPPORT_URL = "https://katekang0815.github.io/knockKnock/support.html";

export default function AboutScreen() {
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

        <Text style={styles.title}>About</Text>

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

        {/* Links */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.btnText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={() => Linking.openURL(SUPPORT_URL)}>
            <Text style={styles.btnText}>Support</Text>
          </TouchableOpacity>
        </View>
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
  title: { color: "#FFFFFF", fontSize: 32, fontFamily: SERIF, fontWeight: "700", marginTop: 16, marginBottom: 16 },
  body: { color: "#C9C2BA", fontSize: 16, lineHeight: 25, fontFamily: "Jost_400Regular", marginBottom: 16 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 16 },
  btn: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Jost_600SemiBold" },
});
