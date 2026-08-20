import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { getDisplayName } from "@/services/profileStore";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

const STROKE = "#FFFFFF";
const SW = 1.6;

/* ---------- Row icons (simple white outlines) ---------- */
function PersonIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.4} stroke={STROKE} strokeWidth={SW} />
      <Path d="M5.5 19.5 C5.5 15.9 8.4 14 12 14 C15.6 14 18.5 15.9 18.5 19.5" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16 L6 10.5 C6 7.2 8.7 5 12 5 C15.3 5 18 7.2 18 10.5 L18 16 L20 18.5 L4 18.5 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M10 20 C10.5 21 11.2 21.5 12 21.5 C12.8 21.5 13.5 21 14 20" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function LockIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10.5} width={14} height={9.5} rx={2} stroke={STROKE} strokeWidth={SW} />
      <Path d="M8 10.5 L8 8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 L16 10.5" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function AccessibilityIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={4.6} r={1.6} stroke={STROKE} strokeWidth={SW} />
      <Path d="M4.5 8.5 C7 9.7 9.4 10.2 12 10.2 C14.6 10.2 17 9.7 19.5 8.5" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <Path d="M12 10.2 L12 15 M12 15 L9 21 M12 15 L15 21" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function GlobeIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.2} stroke={STROKE} strokeWidth={SW} />
      <Path d="M3.8 12 L20.2 12 M12 3.8 C14.2 6 15.3 9 15.3 12 C15.3 15 14.2 18 12 20.2 C9.8 18 8.7 15 8.7 12 C8.7 9 9.8 6 12 3.8 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
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
function FeedbackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6 L6 6 M4 12 L6 12 M4 18 L6 18" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <Path d="M9 6 L20 6 M9 12 L20 12 M9 18 L20 18" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function ChatIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 6 C4.5 5 5.3 4.2 6.3 4.2 L17.7 4.2 C18.7 4.2 19.5 5 19.5 6 L19.5 14 C19.5 15 18.7 15.8 17.7 15.8 L9.5 15.8 L5.5 19.5 L5.5 15.8 C4.9 15.8 4.5 15.2 4.5 14.5 Z" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
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
function DonateIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.2} stroke={STROKE} strokeWidth={SW} />
      <Path d="M12 7 L12 17 M14.4 9 C14.4 8 13.4 7.4 12 7.4 C10.6 7.4 9.6 8.1 9.6 9.2 C9.6 11.8 14.4 10.6 14.4 13.4 C14.4 14.6 13.3 15.3 12 15.3 C10.6 15.3 9.5 14.7 9.5 13.6" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
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
  { slug: "profile", label: "Yehsun Kang", icon: PersonIcon },
  { slug: "notifications", label: "Notifications", icon: BellIcon },
  { slug: "security", label: "Security & data", icon: LockIcon },
  { slug: "accessibility", label: "Accessibility", icon: AccessibilityIcon },
  { slug: "language", label: "Language", icon: GlobeIcon },
  { slug: "hotlines", label: "Mental health hotlines", icon: LifebuoyIcon },
  { slug: "feedback", label: "Feedback", icon: FeedbackIcon },
  { slug: "contact", label: "Contact the team", icon: ChatIcon },
  { slug: "about", label: "About", icon: InfoIcon },
  { slug: "donate", label: "Donate", icon: DonateIcon },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  // Not persisted — Hide only dismisses for now; the banner returns on reload.
  const [bannerHidden, setBannerHidden] = useState(false);
  const hideBanner = () => setBannerHidden(true);

  // Reflect the saved display name on the profile row; refresh on focus so an
  // edit on the profile screen shows here when the user comes back.
  const [displayName, setName] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      getDisplayName().then(setName);
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + (bannerHidden ? 40 : 190),
        }}
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
                  item.slug === "profile"
                    ? router.push("/settings/profile")
                    : item.slug === "donate"
                      ? router.push("/settings/donate")
                      : router.push({ pathname: "/settings/[slug]", params: { slug: item.slug, title: item.label } })
                }
              >
                <View style={styles.rowIcon}>
                  <Icon />
                </View>
                <Text style={styles.rowLabel}>
                  {item.slug === "profile" ? displayName ?? item.label : item.label}
                </Text>
                <Arrow />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Donation banner pinned to the bottom (dismissible). */}
      {!bannerHidden && (
        <View style={[styles.banner, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerText}>
                Support our mission — KnockKnock is made possible by donations
              </Text>
              <View style={styles.bannerActions}>
                <TouchableOpacity
                  style={styles.bannerDonate}
                  activeOpacity={0.85}
                  onPress={() => router.push("/settings/donate")}
                >
                  <Text style={styles.bannerDonateText}>Donate</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={hideBanner} activeOpacity={0.7} hitSlop={10}>
                  <Text style={styles.bannerHide}>Hide</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Image
              source={require("@/assets/images/donate-gift.png")}
              style={styles.bannerArt}
              resizeMode="contain"
            />
          </View>
        </View>
      )}
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
  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#1A1A1A",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  bannerRow: { flexDirection: "row", alignItems: "center" },
  bannerLeft: { flex: 1, paddingRight: 10 },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Jost_400Regular",
  },
  bannerActions: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  bannerDonate: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 22,
  },
  bannerDonateText: { color: "#111111", fontSize: 15, fontFamily: "Jost_600SemiBold" },
  bannerHide: {
    color: "#9A938B",
    fontSize: 15,
    fontFamily: "Jost_400Regular",
    marginLeft: 20,
  },
  bannerArt: { width: 96, height: 96 },
});
