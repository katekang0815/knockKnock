import * as FileSystem from "expo-file-system/legacy";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  deleteAllData,
  exportCsv,
  getFlag,
  SEC_KEYS,
  setFlag,
} from "@/services/securityStore";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });
const SW = 1.6;
const STROKE = "#FFFFFF";

function FaceIdIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8 V6 A2 2 0 0 1 6 4 H8 M16 4 H18 A2 2 0 0 1 20 6 V8 M20 16 V18 A2 2 0 0 1 18 20 H16 M8 20 H6 A2 2 0 0 1 4 18 V16" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
      <Circle cx={9} cy={10} r={0.6} fill={STROKE} />
      <Circle cx={15} cy={10} r={0.6} fill={STROKE} />
      <Path d="M12 9 V12.5 M10.5 15 C11.4 15.6 12.6 15.6 13.5 15" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    </Svg>
  );
}
function DownIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4 V15 M7 11 L12 16 L17 11 M5 19 H19" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function Arrow() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12 L18 12 M13 6 L19 12 L13 18" stroke={STROKE} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const [faceId, setFaceId] = useState(false);

  useEffect(() => {
    getFlag(SEC_KEYS.faceId).then(setFaceId);
  }, []);

  const onFaceId = async (val: boolean) => {
    if (!val) {
      setFaceId(false);
      await setFlag(SEC_KEYS.faceId, false);
      return;
    }
    const hasHw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHw || !enrolled) {
      Alert.alert(
        "Not set up",
        "Set up Face ID or a passcode in your iOS Settings first.",
      );
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm to enable Face ID lock",
    });
    if (!res.success) return;
    setFaceId(true);
    await setFlag(SEC_KEYS.faceId, true);
  };

  const onDownload = async () => {
    try {
      const csv = await exportCsv();
      const uri = (FileSystem.cacheDirectory ?? "") + "KnockKnock-CheckIns.csv";
      await FileSystem.writeAsStringAsync(uri, csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "text/csv",
          dialogTitle: "Your KnockKnock data",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Export ready", "Sharing isn't available on this device.");
      }
    } catch {
      Alert.alert("Export failed", "Could not prepare your data. Please try again.");
    }
  };

  const onDelete = () => {
    Alert.alert(
      "Delete all my data",
      "All data you generated will be permanently deleted from your device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAllData();
            setFaceId(false);
            Alert.alert("Deleted", "Your data has been removed from this device.");
          },
        },
      ],
    );
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
            <Path d="M15 5 L8 12 L15 19" stroke={STROKE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.title}>Security &amp; data</Text>

        {/* Verification */}
        <Text style={styles.section}>Verification</Text>
        <Text style={styles.sectionSub}>
          Use your phone&apos;s passcode or Face ID to securely access your check-ins.
        </Text>
        <View style={styles.row}>
          <FaceIdIcon />
          <Text style={styles.rowLabel}>Face ID / Passcode</Text>
          <Switch value={faceId} onValueChange={onFaceId} trackColor={{ true: "#34C759", false: "#3A3A3C" }} thumbColor="#FFFFFF" ios_backgroundColor="#3A3A3C" />
        </View>

        {/* Data */}
        <Text style={[styles.section, { marginTop: 34 }]}>Data</Text>
        <TouchableOpacity style={styles.row} onPress={onDownload} activeOpacity={0.6}>
          <DownIcon />
          <Text style={styles.rowLabel}>Download my data</Text>
          <Arrow />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
          <Text style={styles.deleteText}>Delete all my data</Text>
        </TouchableOpacity>
        <Text style={styles.deleteNote}>
          All data you generated will be deleted from your device. This cannot be undone.
        </Text>
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
  section: { color: "#FFFFFF", fontSize: 22, fontFamily: SERIF, fontWeight: "700", marginBottom: 6 },
  sectionSub: { color: "#9A938B", fontSize: 15, lineHeight: 21, fontFamily: "Jost_400Regular", marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  rowTextCol: { flex: 1, marginLeft: 16 },
  rowLabel: { flex: 1, color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular", marginLeft: 16 },
  rowLabelPlain: { color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular" },
  rowSub: { color: "#9A938B", fontSize: 13, fontFamily: "Jost_400Regular", marginTop: 2 },
  deleteBtn: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  deleteText: { color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_600SemiBold" },
  deleteNote: { color: "#7C766E", fontSize: 13, lineHeight: 19, fontFamily: "Jost_400Regular", textAlign: "center", marginTop: 12, paddingHorizontal: 10 },
});
