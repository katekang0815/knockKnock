import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { deleteSession, getSessions } from "@/services/beliefStore";
import type { SessionRecord, ChatEntry } from "@/types/belief";

const { width: SCREEN_W } = Dimensions.get("window");
const MENU_W = 160;
const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
function fmtTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Newer sessions store the full transcript; older ones fall back to their fields.
function sessionTranscript(s: SessionRecord): ChatEntry[] {
  if (s.transcript && s.transcript.length) return s.transcript;
  const out: ChatEntry[] = [];
  if (s.issue) out.push({ role: "user", text: s.issue });
  if (s.verse) out.push({ role: "ai", text: `${s.verse.reference}  ${s.verse.text}`, kind: "verse" });
  if (s.prayer) out.push({ role: "ai", text: s.prayer, kind: "prayer" });
  return out;
}

export default function SessionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSessions().then((list) => setSession(list.find((s) => s.id === id) ?? null));
    }, [id]),
  );

  // ••• popover, anchored just below the icon.
  const menuRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const onMenu = () => {
    menuRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setMenuOpen(true);
    });
  };
  const onDelete = async () => {
    setMenuOpen(false);
    if (id) await deleteSession(id);
    router.back();
  };
  const menuTop = anchor.y + anchor.h + 6;
  const menuLeft = Math.max(12, Math.min(anchor.x + anchor.w - MENU_W, SCREEN_W - MENU_W - 12));

  const transcript = session ? sessionTranscript(session) : [];
  const chat = transcript.filter((m) => !m.kind); // AI + user conversation
  const verse = transcript.find((m) => m.kind === "verse");
  const prayer = transcript.find((m) => m.kind === "prayer");
  const chips = (session?.context ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const verseSep = verse ? verse.text.indexOf("  ") : -1;
  const verseRef = verseSep > 0 ? verse!.text.slice(0, verseSep) : "";
  const verseBody = verse ? (verseSep > 0 ? verse.text.slice(verseSep + 2) : verse.text) : "";

  return (
    <View style={styles.container}>
      {/* Warm gradient background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="sessBg" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor="#2A2422" />
              <Stop offset="1" stopColor="#241812" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#sessBg)" />
        </Svg>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7} hitSlop={10}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path d="M15 5 L8 12 L15 19" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

        {/* Header: date/time + emotion */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.date}>{session ? fmtDate(session.date) : ""}</Text>
            <Text style={styles.time}>{session ? fmtTime(session.date) : ""}</Text>
          </View>
          <Text style={styles.emotion} numberOfLines={1}>
            {session?.emotion}
          </Text>
        </View>

        {/* Context chips + menu */}
        <View style={styles.chipsRow}>
          <View style={styles.chips}>
            {chips.map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity ref={menuRef} onPress={onMenu} activeOpacity={0.7} hitSlop={10} style={styles.menuBtn}>
            <Svg width={26} height={10} viewBox="0 0 26 10">
              <Circle cx={5} cy={5} r={2} fill="#FFFFFF" />
              <Circle cx={13} cy={5} r={2} fill="#FFFFFF" />
              <Circle cx={21} cy={5} r={2} fill="#FFFFFF" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Chat conversation */}
        {chat.length > 0 && (
          <View style={styles.box}>
            {chat.map((m, i) => (
              <Text key={i} style={[m.role === "ai" ? styles.aiText : styles.userMsg, i > 0 && styles.msgGap]}>
                {m.text}
              </Text>
            ))}
          </View>
        )}

        {/* Verse */}
        {verse && (
          <View style={styles.box}>
            {!!verseRef && <Text style={styles.verseRef}>{verseRef}</Text>}
            <Text style={styles.userText}>{verseBody}</Text>
          </View>
        )}

        {/* Prayer */}
        {prayer && (
          <View style={styles.box}>
            <Text style={styles.prayerText}>{prayer.text}</Text>
          </View>
        )}
      </ScrollView>

      {/* ••• popover, positioned right below the icon. */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={{ flex: 1 }}>
            <View style={[styles.menuCard, { top: menuTop, left: menuLeft }]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setMenuOpen(false)} activeOpacity={0.7}>
                <Text style={styles.menuText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={onDelete} activeOpacity={0.7}>
                <Text style={[styles.menuText, styles.menuDelete]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#241812" },
  back: { width: 40, height: 40, justifyContent: "center", marginLeft: -8, marginBottom: 4 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  date: { color: "#FFFFFF", fontSize: 20, fontFamily: SERIF, fontWeight: "700" },
  time: { color: "#FFFFFF", fontSize: 16, fontFamily: SERIF, marginTop: 2 },
  emotion: { color: "#FF9A7B", fontSize: 26, fontFamily: SERIF, fontStyle: "italic", maxWidth: "50%", textAlign: "right" },
  chipsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  chipText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Jost_400Regular" },
  menuBtn: { paddingLeft: 12, paddingVertical: 6 },
  box: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  aiText: {
    color: "#9A8F86",
    fontSize: 17,
    lineHeight: 26,
    fontFamily: "Jost_400Regular_Italic",
  },
  userText: {
    color: "#F0E8DE",
    fontSize: 17,
    lineHeight: 26,
    fontFamily: "Jost_400Regular",
  },
  userMsg: {
    color: "#E6C79E", // matches the chat-flow user text (soft faded amber)
    fontSize: 17,
    lineHeight: 26,
    fontFamily: "Jost_400Regular",
  },
  msgGap: { marginTop: 18 },
  menuCard: {
    position: "absolute",
    width: MENU_W,
    backgroundColor: "#1E1C1A",
    borderRadius: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  menuItem: { paddingVertical: 14, paddingHorizontal: 18 },
  menuText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Jost_400Regular" },
  menuDelete: { color: "#E8614D" },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.12)", marginHorizontal: 12 },
  verseRef: { color: "#E0967D", fontSize: 16, fontFamily: "Jost_700Bold", marginBottom: 6 },
  prayerText: {
    color: "#F0E8DE",
    fontSize: 17,
    lineHeight: 27,
    fontFamily: "Jost_400Regular_Italic",
  },
});
