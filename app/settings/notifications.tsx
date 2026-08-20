import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import {
  clearReminder,
  ensurePermission,
  getReminder,
  saveReminder,
  type Reminder,
} from "@/services/reminderStore";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

function periodLabel(h: number): string {
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}

function fmtTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function dateFrom(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function HexIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2.5 L20 7 L20 17 L12 21.5 L4 17 L4 7 Z" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={2.4} stroke="#FFFFFF" strokeWidth={1.6} />
    </Svg>
  );
}

function Arrow() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12 L18 12 M13 6 L19 12 L13 18" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [reminder, setReminder] = useState<Reminder | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState(() => dateFrom(8, 15));
  const [surprise, setSurprise] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getReminder().then(setReminder);
    }, []),
  );

  const openModal = () => {
    if (reminder) {
      setDate(dateFrom(reminder.hour, reminder.minute));
      setSurprise(reminder.surprise);
    } else {
      setDate(dateFrom(8, 15));
      setSurprise(false);
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    const granted = await ensurePermission();
    if (!granted) {
      setModalOpen(false);
      Alert.alert(
        "Notifications are off",
        "Turn on KnockKnock notifications in iOS Settings to receive reminders.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    const saved = await saveReminder({
      hour: date.getHours(),
      minute: date.getMinutes(),
      surprise,
    });
    setReminder(saved);
    setModalOpen(false);
  };

  const handleRemove = async () => {
    await clearReminder();
    setReminder(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>

      <Text style={styles.title}>Notifications</Text>

      <Text style={styles.body}>
        A daily rhythm of prayer and reflection draws you closer to God. Gentle reminders help you
        keep knocking — one honest moment at a time.
      </Text>
      <Text style={styles.bodyBold}>
        You&apos;ll need to turn on KnockKnock notifications in your iOS Settings.
      </Text>

      {/* iOS Settings row */}
      <TouchableOpacity style={styles.row} onPress={() => Linking.openSettings()} activeOpacity={0.6}>
        <HexIcon />
        <Text style={styles.rowLabel}>iOS Settings</Text>
        <Arrow />
      </TouchableOpacity>

      {/* Current reminder (if set) */}
      {reminder && (
        <TouchableOpacity style={styles.reminderRow} onPress={openModal} activeOpacity={0.7}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTime}>
              {surprise || reminder.surprise ? "Surprise · " : ""}
              {fmtTime(dateFrom(reminder.hour, reminder.minute))}
            </Text>
            <Text style={styles.reminderSub}>Daily reminder</Text>
          </View>
          <TouchableOpacity onPress={handleRemove} activeOpacity={0.7} hitSlop={12}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Add Daily Reminder button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity style={styles.addBtn} onPress={openModal} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>{reminder ? "Edit Daily Reminder" : "Add Daily Reminder"}</Text>
        </TouchableOpacity>
      </View>

      {/* Time-picker sheet */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetPeriod}>{periodLabel(date.getHours())}</Text>
                <Text style={styles.sheetTime}>{surprise ? "Random time" : fmtTime(date)}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalOpen(false)} activeOpacity={0.7}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path d="M6 6 L18 18 M18 6 L6 18" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Surprise me */}
            <View style={styles.surpriseRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.surpriseTitle}>Surprise me</Text>
                <Text style={styles.surpriseSub}>Reminder at a random time</Text>
              </View>
              <Switch
                value={surprise}
                onValueChange={setSurprise}
                trackColor={{ true: "#34C759", false: "#3A3A3C" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#3A3A3C"
              />
            </View>

            {/* Time picker (dimmed when surprise is on) */}
            <View style={[styles.pickerWrap, surprise && { opacity: 0.35 }]} pointerEvents={surprise ? "none" : "auto"}>
              <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                minuteInterval={5}
                themeVariant="dark"
                textColor="#FFFFFF"
                onChange={(_e, d) => d && setDate(d)}
                style={{ alignSelf: "stretch" }}
              />
            </View>

            {/* Save */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  body: { color: "#9A938B", fontSize: 16, lineHeight: 23, fontFamily: "Jost_400Regular" },
  bodyBold: { color: "#FFFFFF", fontSize: 16, lineHeight: 23, fontFamily: "Jost_600SemiBold", marginTop: 18, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 12,
  },
  rowLabel: { flex: 1, color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular", marginLeft: 16 },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  reminderTime: { color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_600SemiBold" },
  reminderSub: { color: "#9A938B", fontSize: 13, fontFamily: "Jost_400Regular", marginTop: 2 },
  removeText: { color: "#E8614D", fontSize: 15, fontFamily: "Jost_600SemiBold" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 22, backgroundColor: "#000000" },
  addBtn: { height: 60, borderRadius: 30, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" },
  addBtnText: { color: "#111111", fontSize: 17, fontFamily: "Jost_600SemiBold" },
  // Sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  sheetPeriod: { color: "#FFFFFF", fontSize: 30, fontFamily: SERIF, fontWeight: "700" },
  sheetTime: { color: "#9A938B", fontSize: 22, fontFamily: SERIF, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#2A2A2A", justifyContent: "center", alignItems: "center" },
  surpriseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  surpriseTitle: { color: "#FFFFFF", fontSize: 17, fontFamily: "Jost_400Regular" },
  surpriseSub: { color: "#9A938B", fontSize: 13, fontFamily: "Jost_400Regular", marginTop: 2 },
  pickerWrap: { marginVertical: 8 },
  saveBtn: { height: 60, borderRadius: 30, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", marginTop: 8 },
  saveText: { color: "#111111", fontSize: 17, fontFamily: "Jost_600SemiBold" },
});
