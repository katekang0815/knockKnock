import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

// Buy Me a Coffee page (Yehsun Kang).
const DONATE_URL = "https://buymeacoffee.com/katekang";

const AMOUNTS = [25, 75, 150, 300];

export default function DonateScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<number | null>(null);

  const openDonate = () => {
    // Buy Me a Coffee opens in the browser, where the supporter picks the
    // amount and can pay with Apple Pay. (BMC has no reliable preset-amount
    // URL param, so the in-app amounts are suggestions only.)
    Linking.openURL(DONATE_URL).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.title}>Support our mission</Text>
        <Text style={styles.subtitle}>
          Your donation helps keep the app free and accessible to everyone. Contribute any
          amount to support our mission and future development.
        </Text>

        {/* Amount grid */}
        <View style={styles.grid}>
          {AMOUNTS.map((amt) => {
            const active = selected === amt;
            return (
              <TouchableOpacity
                key={amt}
                style={[styles.amountBtn, active && styles.amountBtnActive]}
                activeOpacity={0.8}
                onPress={() => setSelected(amt)}
              >
                <Text style={[styles.amountText, active && styles.amountTextActive]}>${amt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.wideBtn}
          activeOpacity={0.8}
          onPress={() => openDonate()}
        >
          <Text style={styles.wideText}>Choose amount</Text>
        </TouchableOpacity>

        {/* Illustration */}
        <Image
          source={require("@/assets/images/donate-gift.png")}
          style={styles.art}
          resizeMode="contain"
        />
      </ScrollView>

      {/* Sticky donate button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity style={styles.donateBtn} activeOpacity={0.85} onPress={openDonate}>
          <Text style={styles.donateText}>Donate with Buy Me a Coffee</Text>
        </TouchableOpacity>
      </View>
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
    marginLeft: 20,
    marginTop: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: SERIF,
    fontWeight: "700",
    marginTop: 14,
    marginHorizontal: 22,
  },
  subtitle: {
    color: "#9A938B",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Jost_400Regular",
    marginTop: 12,
    marginHorizontal: 22,
    marginBottom: 26,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    rowGap: 14,
  },
  amountBtn: {
    width: "48%",
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#0E0E0E",
    justifyContent: "center",
    alignItems: "center",
  },
  amountBtnActive: {
    borderColor: "#E06E4E",
    backgroundColor: "#1A100C",
  },
  amountText: { color: "#EDE7E0", fontSize: 18, fontFamily: "Jost_400Regular" },
  amountTextActive: { color: "#F2A88C" },
  wideBtn: {
    marginTop: 14,
    marginHorizontal: 22,
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#0E0E0E",
    justifyContent: "center",
    alignItems: "center",
  },
  wideText: { color: "#EDE7E0", fontSize: 17, fontFamily: "Jost_400Regular" },
  art: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginTop: 26,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    backgroundColor: "#000000",
  },
  donateBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  donateText: { color: "#111111", fontSize: 17, fontFamily: "Jost_600SemiBold" },
});
