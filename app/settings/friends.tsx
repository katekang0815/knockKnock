import { router } from "expo-router";
import { useState } from "react";
import { Platform, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

// Friend invite. TODO: swap INVITE_URL for the App Store link once the app is live.
const INVITE_URL = "https://katekang0815.github.io/knockKnock/";
const INVITE_MESSAGE = `Join me on KnockKnock — a daily prayer & reflection space. 🙏\n${INVITE_URL}`;

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);

  const handleShareInvite = async () => {
    try {
      await Share.share({ message: INVITE_MESSAGE, url: INVITE_URL });
    } catch {
      // user dismissed the share sheet
    }
  };
  const handleCopyInvite = async () => {
    await Clipboard.setStringAsync(INVITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>

      <Text style={styles.title}>Invite friends</Text>

      <Text style={styles.body}>
        Share KnockKnock with someone you care about — a daily space to pray, reflect, and keep
        knocking together.
      </Text>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite} activeOpacity={0.85}>
        <Text style={styles.shareText}>Share invite link</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.copyBtn} onPress={handleCopyInvite} activeOpacity={0.7}>
        <Text style={styles.copyText}>{copied ? "Link copied ✓" : "Copy link"}</Text>
      </TouchableOpacity>
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
  title: { color: "#FFFFFF", fontSize: 34, fontFamily: SERIF, fontWeight: "600", marginTop: 18, marginBottom: 20 },
  body: { color: "#9A938B", fontSize: 16, lineHeight: 23, fontFamily: "Jost_400Regular", marginBottom: 28 },
  shareBtn: { backgroundColor: "#DB533C", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  shareText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Jost_600SemiBold" },
  copyBtn: { backgroundColor: "#2E2A26", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 12 },
  copyText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Jost_600SemiBold" },
});
